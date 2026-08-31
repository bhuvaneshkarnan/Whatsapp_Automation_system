.PHONY: up down logs build db-reset psql deploy

# Start the full stack locally
up:
	docker-compose up -d

# Stop the full stack
down:
	docker-compose down

# View logs for all services
logs:
	docker-compose logs -f

# Rebuild all service images
build:
	docker-compose build

# Reset the database (WARNING: Destroys all local data)
db-reset:
	docker-compose down -v
	docker-compose up -d postgres redis
	echo "Waiting for PostgreSQL to be ready..."
	sleep 10
	docker-compose up -d

# Drop into PostgreSQL interactive shell
psql:
	docker-compose exec postgres psql -U platform_user -d whatsapp_platform

# Generate a secure JWT secret
generate-secret:
	@node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Deploy to Oracle Cloud Free Tier via SSH
# Usage: make deploy HOST=ubuntu@123.45.67.89
deploy:
	@if [ -z "$(HOST)" ]; then echo "HOST is required (e.g. make deploy HOST=ubuntu@123.45.67.89)"; exit 1; fi
	ssh $(HOST) 'mkdir -p /app/whatsapp-automation'
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.next' ./ $(HOST):/app/whatsapp-automation/
	ssh $(HOST) 'cd /app/whatsapp-automation && docker-compose build && docker-compose up -d --remove-orphans'
	@echo "Deployment complete."
