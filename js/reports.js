// GITInvoice — reports and charts
'use strict';
let revenueChart = null;
let statusChart = null;
// ==================== REPORTS ====================

function loadReports() {
    const invoices = getInvoices();
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'paid');
    const paidRevenue = paid.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const avg = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const collectionRate = invoices.length > 0 ? (paid.length / invoices.length * 100) : 0;
    const activeCustomers = new Set(invoices.map(inv => inv.customerName)).size;

    document.getElementById('report-total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('report-avg-invoice').textContent = formatCurrency(avg);
    document.getElementById('report-collection-rate').textContent = `${collectionRate.toFixed(1)}%`;
    document.getElementById('report-active-customers').textContent = activeCustomers;

    loadRevenueChart(invoices);
    loadStatusChart(invoices);
    loadTopCustomers(invoices);
    if (canUseExpenses()) loadProfitReport(invoices);
}

function loadProfitReport(invoices) {
    const existing = document.getElementById('profit-report-section');
    if (existing) existing.remove();
    const expenses = getExpenses();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth()-i);
        const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
        const label = d.toLocaleDateString('en-US',{month:'short',year:'numeric'});
        const rev = invoices.filter(inv => { const k=new Date(inv.date); return inv.status==='paid'&&k.getFullYear()+'-'+String(k.getMonth()+1).padStart(2,'0')===key; }).reduce((s,i)=>s+i.total,0);
        const exp = expenses.filter(e => { const k=new Date(e.date); return k.getFullYear()+'-'+String(k.getMonth()+1).padStart(2,'0')===key; }).reduce((s,e)=>s+e.amount,0);
        months.push({label,rev,exp,profit:rev-exp});
    }
    const byCat = {}; expenses.forEach(e => { byCat[e.category]=(byCat[e.category]||0)+e.amount; });
    const catRows = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>`<tr><td>${escapeHtml(cat)}</td><td>${formatCurrency(amt)}</td></tr>`).join('');
    const totalRev = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
    const totalExp = expenses.reduce((s,e)=>s+e.amount,0);
    const sec = document.createElement('div');
    sec.id = 'profit-report-section';
    sec.innerHTML = `<div class="section-header" style="margin-top:32px"><div class="section-title">Profit & Loss — Last 6 Months</div></div>
        <table class="invoice-table" style="margin-bottom:24px">
            <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th></tr></thead>
            <tbody>${months.map(m=>`<tr><td>${m.label}</td><td>${formatCurrency(m.rev)}</td><td>${formatCurrency(m.exp)}</td><td style="${m.profit<0?'color:var(--danger)':'color:var(--success,#00ba88)'}"><strong>${formatCurrency(m.profit)}</strong></td></tr>`).join('')}</tbody>
            <tfoot><tr style="font-weight:700"><td>Total</td><td>${formatCurrency(totalRev)}</td><td>${formatCurrency(totalExp)}</td><td style="${totalRev-totalExp<0?'color:var(--danger)':'color:var(--success,#00ba88)'}"><strong>${formatCurrency(totalRev-totalExp)}</strong></td></tr></tfoot>
        </table>
        ${catRows?`<div class="section-header"><div class="section-title">Expenses by Category</div></div><table class="invoice-table"><thead><tr><th>Category</th><th>Total Spent</th></tr></thead><tbody>${catRows}</tbody></table>`:''}`;
    document.querySelector('#reports-page .content').appendChild(sec);
}

function loadRevenueChart(invoices) {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const monthlyRevenue = {};
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        monthlyRevenue[key] = 0;
    }

    invoices.forEach(inv => {
        const d = new Date(inv.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenue.hasOwnProperty(key)) monthlyRevenue[key] += inv.total || 0;
    });

    if (revenueChart) revenueChart.destroy();

    const settings = getSettings();
    const sym = settings.currencySymbol || '₦';

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue',
                data: Object.values(monthlyRevenue),
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff6b35',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${sym}${Number(ctx.raw).toLocaleString('en', { minimumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '10%',
                    ticks: {
                        maxTicksLimit: 6,
                        callback: v => {
                            if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
                            if (v >= 1_000)     return `${sym}${(v / 1_000).toFixed(0)}K`;
                            return `${sym}${v}`;
                        }
                    }
                },
                x: {
                    ticks: { maxRotation: 0 }
                }
            }
        }
    });
}

function loadStatusChart(invoices) {
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending', 'Overdue'],
            datasets: [{
                data: [
                    invoices.filter(inv => inv.status === 'paid').length,
                    invoices.filter(inv => inv.status === 'pending').length,
                    invoices.filter(inv => inv.status === 'overdue').length
                ],
                backgroundColor: [
                    'rgba(0, 186, 136, 0.8)',
                    'rgba(255, 165, 0, 0.8)',
                    'rgba(249, 24, 128, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function loadTopCustomers(invoices) {
    const container = document.getElementById('top-customers-container');
    const customerRevenue = {};

    invoices.forEach(inv => {
        if (!customerRevenue[inv.customerName]) {
            customerRevenue[inv.customerName] = { name: inv.customerName, total: 0, count: 0 };
        }
        customerRevenue[inv.customerName].total += inv.total || 0;
        customerRevenue[inv.customerName].count++;
    });

    const top = Object.values(customerRevenue).sort((a, b) => b.total - a.total).slice(0, 5);

    if (top.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-title">No data yet</div>
                <div class="empty-text">Create invoices to see top customers</div>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="invoice-table">
            <thead>
                <tr><th>Customer</th><th>Invoices</th><th>Revenue</th></tr>
            </thead>
            <tbody>
                ${top.map(c => `
                    <tr>
                        <td><strong>${escapeHtml(c.name)}</strong></td>
                        <td>${c.count}</td>
                        <td><strong>${formatCurrency(c.total)}</strong></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;
}

function exportReportData() {
    const invoices = getInvoices();
    let csv = 'Invoice Number,Customer,Date,Due Date,Subtotal,Tax,Total,Status\n';
    invoices.forEach(inv => {
        csv += `"${inv.number}","${inv.customerName}","${inv.date}","${inv.dueDate}","${inv.subtotal || 0}","${inv.tax || 0}","${inv.total}","${inv.status}"\n`;
    });
    downloadFile(csv, `GIT Invoice-report-${today()}.csv`, 'text/csv');
    showToast('Report exported!');
}
