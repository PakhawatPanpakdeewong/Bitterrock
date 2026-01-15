# 🐳 Docker Setup Guide

คู่มือการใช้งาน Docker สำหรับ Bitterrock Application

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## 🚀 Quick Start

### 1. สร้างไฟล์ Environment

```bash
# คัดลอกไฟล์ตัวอย่าง
cp .docker.env.example .docker.env

# แก้ไขค่าต่างๆ ตามต้องการ
# โดยเฉพาะ DB_PASSWORD และ R2 credentials (ถ้ามี)
```

### 2. เริ่มต้นใช้งาน

#### Production Mode
```bash
# ใช้สคริปต์ที่เตรียมไว้
chmod +x docker-start.sh docker-stop.sh
./docker-start.sh

# หรือใช้ docker-compose โดยตรง
docker-compose --env-file .docker.env up --build -d
```

#### Development Mode
```bash
# ใช้สคริปต์
./docker-start.sh dev

# หรือใช้ docker-compose โดยตรง
docker-compose -f docker-compose.dev.yml --env-file .docker.env up --build
```

### 3. เข้าถึง Application

- **Application**: http://localhost:3001
- **API Routes**: http://localhost:3001/api/*
- **Database**: localhost:5433 (default, mapped from container port 5432)

## 📝 Environment Variables

แก้ไขไฟล์ `.docker.env` เพื่อตั้งค่าต่างๆ:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=bitterrock_db
DB_PORT=5432

# Application Configuration
APP_PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3001

# AWS S3/R2 Configuration (Optional)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=your_endpoint
R2_PUBLIC_URL=your_public_url
```

## 🛠️ คำสั่งที่ใช้บ่อย

### ดู Logs
```bash
# Production
docker-compose --env-file .docker.env logs -f

# Development
docker-compose -f docker-compose.dev.yml --env-file .docker.env logs -f

# ดู logs ของ service เฉพาะ
docker-compose --env-file .docker.env logs -f app
docker-compose --env-file .docker.env logs -f postgres
```

### หยุดการทำงาน
```bash
# ใช้สคริปต์
./docker-stop.sh

# หรือใช้ docker-compose
docker-compose --env-file .docker.env down
```

### หยุดและลบ Volumes (ลบข้อมูล Database)
```bash
docker-compose --env-file .docker.env down -v
```

### Rebuild Images
```bash
docker-compose --env-file .docker.env build --no-cache
```

### เข้าไปใน Container
```bash
# เข้าไปใน app container
docker exec -it bitterrock-app bash

# เข้าไปใน database container
docker exec -it bitterrock-db psql -U postgres -d bitterrock_db
```

## 🗄️ Database Management

### Database จะถูก Initialize อัตโนมัติ

เมื่อเริ่มต้นครั้งแรก PostgreSQL จะรัน `database/schemas/schema.sql` อัตโนมัติ

### Backup Database
```bash
docker exec bitterrock-db pg_dump -U postgres bitterrock_db > backup.sql
```

### Restore Database
```bash
docker exec -i bitterrock-db psql -U postgres bitterrock_db < backup.sql
```

## 🔧 Troubleshooting

### Port ถูกใช้งานแล้ว
```bash
# เปลี่ยน port ใน .docker.env
# Default: DB_PORT=5433 (เพื่อหลีกเลี่ยงการชนกับ PostgreSQL ที่รันอยู่แล้ว)
# ถ้า 5433 ก็ถูกใช้งานแล้ว ให้เปลี่ยนเป็น port อื่น เช่น 5434
APP_PORT=3002
DB_PORT=5434
```

### Database Connection Error
```bash
# ตรวจสอบว่า database container ทำงานอยู่
docker-compose --env-file .docker.env ps

# ตรวจสอบ logs
docker-compose --env-file .docker.env logs postgres

# ตรวจสอบ health status
docker inspect bitterrock-db | grep Health -A 10
```

### Application ไม่สามารถเชื่อมต่อ Database
- ตรวจสอบว่า `DB_HOST=postgres` (ชื่อ service ใน docker-compose)
- ตรวจสอบว่า `depends_on` ทำงานถูกต้อง
- รอให้ database healthcheck ผ่านก่อน

### Rebuild หลังจากแก้ไข Code
```bash
# Production
docker-compose --env-file .docker.env up --build -d

# Development (hot reload)
# ไม่ต้อง rebuild แต่ถ้าต้องการ
docker-compose -f docker-compose.dev.yml --env-file .docker.env up --build
```

## 📦 Volumes

Docker จะสร้าง volumes สำหรับ:
- `postgres_data`: เก็บข้อมูล PostgreSQL
- `./public/uploads`: ไฟล์ที่อัปโหลด (mapped จาก host)

## 🌐 Network

Containers ทั้งหมดอยู่ใน network เดียวกัน (`bitterrock-network`) เพื่อให้สามารถสื่อสารกันได้

## ☁️ Deploy บน Cloud (Production)

### ขั้นตอนการ Deploy บน Cloud Server (VM, EC2, DigitalOcean, etc.)

#### 1. เตรียมไฟล์ Environment สำหรับ Production

```bash
# บนเครื่อง cloud server
# คัดลอกไฟล์ template สำหรับ production
cp env.production.example .docker.env

# แก้ไข .docker.env ด้วย editor ที่คุณชอบ
nano .docker.env
# หรือ
vim .docker.env
```

**สิ่งที่ต้องแก้ไข:**
- `DB_PASSWORD`: เปลี่ยนเป็นรหัสผ่านที่แข็งแรง
- `NEXT_PUBLIC_APP_URL`: เปลี่ยนเป็น domain จริงของคุณ (เช่น `https://yourdomain.com`)
- `R2_*`: ตั้งค่าถ้าต้องการใช้ Cloudflare R2 หรือ AWS S3 สำหรับ file storage

#### 2. Clone โปรเจกต์ (ถ้ายังไม่มี)

```bash
git clone <your-repo-url>
cd Bitterrock
```

#### 3. Deploy ด้วย Docker Compose

```bash
# Build และ start containers
docker-compose up --build -d

# ตรวจสอบสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f
```

#### 4. ตั้งค่า Reverse Proxy (แนะนำ: Nginx)

สร้างไฟล์ `/etc/nginx/sites-available/bitterrock`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bitterrock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. ตั้งค่า SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### ⚠️ สิ่งสำคัญสำหรับ Production

1. **Security:**
   - ใช้รหัสผ่านที่แข็งแรงสำหรับ database
   - อย่า commit `.docker.env` ลง Git
   - ตั้งค่า firewall (UFW) บน server
   - ใช้ HTTPS เท่านั้น

2. **Backup:**
   - Backup database เป็นประจำ
   ```bash
   docker exec bitterrock-db pg_dump -U postgres bitterrock_db > backup_$(date +%Y%m%d).sql
   ```

3. **Monitoring:**
   - ตั้งค่า log rotation
   - ใช้ monitoring tools (เช่น PM2, systemd, หรือ cloud monitoring)

4. **Updates:**
   ```bash
   # Pull code ใหม่
   git pull
   
   # Rebuild และ restart
   docker-compose up --build -d
   ```

### 📝 หมายเหตุ

- `docker-compose.yml` ใช้ `env_file: .docker.env` แล้ว ดังนั้นไม่ต้องใช้ `--env-file` flag
- ไฟล์ `.docker.env` ถูก ignore ใน `.gitignore` แล้ว
- สำหรับ Container Platforms (Render, Railway, etc.) ให้ใช้ Environment Variables ใน dashboard แทนไฟล์ `.env`

## 🔐 Security Notes

1. **อย่า commit `.docker.env`** ลงใน Git
2. ใช้ password ที่แข็งแรงสำหรับ database
3. เก็บ R2 credentials ไว้เป็นความลับ
4. ใน production ควรใช้ secrets management

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

