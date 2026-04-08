<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use InvoHub\Config\Database;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$migrationFiles = glob(__DIR__ . '/migrations/*.sql') ?: [];
sort($migrationFiles);

if ($migrationFiles === []) {
    echo "No migration files found.\n";
    exit(0);
}

Database::beginTransaction();

try {
    foreach ($migrationFiles as $file) {
        $sql = trim((string) file_get_contents($file));
        if ($sql === '') {
            continue;
        }

        echo 'Running ' . basename($file) . "...\n";
        Database::getInstance()->exec($sql);
    }

    Database::commit();
    echo "Migrations completed successfully.\n";
} catch (Throwable $exception) {
    Database::rollback();
    fwrite(STDERR, 'Migration failed: ' . $exception->getMessage() . "\n");
    exit(1);
}
