<?php

namespace InvoHub\Services;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    public function send(string $to, string $subject, string $html): bool
    {
        $host = $_ENV['MAIL_HOST'] ?? '';
        $username = $_ENV['MAIL_USERNAME'] ?? '';
        $password = $_ENV['MAIL_PASSWORD'] ?? '';

        if ($host === '' || $username === '' || $password === '') {
            error_log("Email skipped for {$to}: SMTP not configured.");
            return false;
        }

        $mailer = new PHPMailer(true);

        try {
            $mailer->isSMTP();
            $mailer->Host = $host;
            $mailer->Port = (int) ($_ENV['MAIL_PORT'] ?? 587);
            $mailer->SMTPAuth = true;
            $mailer->Username = $username;
            $mailer->Password = $password;

            $encryption = $_ENV['MAIL_ENCRYPTION'] ?? 'tls';
            $mailer->SMTPSecure = $encryption === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;

            $mailer->setFrom(
                $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@invohub.com',
                $_ENV['MAIL_FROM_NAME'] ?? 'InvoHub'
            );
            $mailer->addAddress($to);
            $mailer->isHTML(true);
            $mailer->Subject = $subject;
            $mailer->Body = $html;

            return $mailer->send();
        } catch (Exception $exception) {
            error_log('Email send failed: ' . $exception->getMessage());
            return false;
        }
    }
}
