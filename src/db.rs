use sqlx::{MySql, Pool, mysql::MySqlPoolOptions};
use std::env;

// Exportamos el tipo de pool para usarlo en main y en rutas
pub type MySqlPoolType = Pool<MySql>;

/// Inicializa y retorna un pool de conexión a MySQL
pub async fn init_pool() -> Result<MySqlPoolType, sqlx::Error> {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL no está definido en .env");

    MySqlPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
}
