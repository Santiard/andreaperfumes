import os
import zipfile
import shutil

zip_filename = "dreaperfumes_cpanel.zip"

# Borrar zip previo si existe
if os.path.exists(zip_filename):
    os.remove(zip_filename)

print("Creando archivo ZIP para cPanel...")

# Asegurar contenido de .env para cPanel
cpanel_env_content = """# =============================================================================
# VARIABLES DE ENTORNO PARA CPANEL (dreaperfumes.com)
# =============================================================================

APP_ENV=production
APP_URL=https://dreaperfumes.com

# Base de Datos MySQL creada en cPanel
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=dreaperfumes_db
DB_USERNAME=dreaperfumes_user
DB_PASSWORD=AQUI_TU_CONTRASENA

# Clave de seguridad JWT para el Panel Administrativo (/drea-admin)
JWT_SECRET=drea_perfumes_super_secure_production_jwt_key_2026_xyz
JWT_EXPIRATION_SECONDS=86400

# Optimización WebP y límites de subida
WEBP_MAX_DIMENSION=1000
WEBP_QUALITY=82
MAX_UPLOAD_BYTES=10485760
TZ=America/Bogota
"""

with open(".env.cpanel", "w", encoding="utf-8") as f:
    f.write(cpanel_env_content)

added_entries = set()

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as z:
    def add_file(src_path, arc_path):
        # Normalizar separadores a '/'
        arc_norm = arc_path.replace("\\", "/")
        if arc_norm not in added_entries:
            z.write(src_path, arc_norm)
            added_entries.add(arc_norm)
            print(f"  + {arc_norm}")

    # 1. Archivos principales de la raíz de public_html (sin pisar .env activo en el servidor)
    add_file(".htaccess", ".htaccess")
    add_file(".env.cpanel", ".env.example")
    add_file(".env.cpanel", ".env.cpanel.example")
    add_file("index.php", "index.php")
    add_file("frontend/dist/index.html", "index.html")
    add_file("frontend/dist/favicon.ico", "favicon.ico")
    if os.path.exists("cpanel_database_setup.sql"):
        add_file("cpanel_database_setup.sql", "cpanel_database_setup.sql")

    # 2. Todo el contenido de assets (JS, CSS, imágenes optimizadas)
    dist_assets_dir = os.path.join("frontend", "dist", "assets")
    for root, dirs, files in os.walk(dist_assets_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, os.path.join("frontend", "dist"))
            add_file(full_path, rel_path)

    # 3. Copia redundante en frontend/dist/ para SeoService si busca ahí
    add_file("frontend/dist/index.html", "frontend/dist/index.html")
    add_file("frontend/dist/favicon.ico", "frontend/dist/favicon.ico")

    # 4. Backend src y backend/public/index.php (SIN vendor)
    add_file("backend/public/index.php", "backend/public/index.php")
    
    backend_src_dir = os.path.join("backend", "src")
    for root, dirs, files in os.walk(backend_src_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, ".")
            add_file(full_path, rel_path)

print(f"\n¡Éxito! ZIP empaquetado con {len(added_entries)} archivos.")
print(f"Tamaño final: {os.path.getsize(zip_filename) / (1024 * 1024):.2f} MB")
