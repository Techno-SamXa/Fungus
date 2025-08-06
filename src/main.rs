use actix_web::{App, HttpServer, web, middleware::Logger};
use dotenvy::dotenv;
use std::env;

mod db;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Cargar variables desde .env
    dotenv().ok();
    env_logger::init(); // Habilita logging

    // Leer puerto y host desde variables de entorno
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());

    // Crear pool de conexión a MySQL
    let db_pool = db::init_pool().await.expect("Error al conectar a la base de datos");

    println!("🚀 Servidor iniciado en http://{}:{}/", host, port);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db_pool.clone()))
            .wrap(Logger::default()) // Middleware para logging de peticiones
            .service(
                web::scope("/api")
                    // .service(routes::crear_producto) → rutas futuras
            )
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}
