#!/bin/bash

# Script de inicialização do TrueCheckIA com Docker Compose
# Uso: ./start-docker.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_header() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "          TrueCheckIA Docker Setup"
    echo "=============================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado!"
        print_info "Instale o Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose não está instalado!"
        print_info "Instale o Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    print_success "Docker e Docker Compose estão instalados"
}

# Verificar se .env existe
check_env() {
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado"
        print_info "Copiando .env.example para .env..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Arquivo .env criado"
            print_warning "IMPORTANTE: Edite o arquivo .env com suas configurações antes de continuar"
            read -p "Pressione Enter para continuar após editar o .env..."
        else
            print_error "Arquivo .env.example não encontrado!"
            exit 1
        fi
    else
        print_success "Arquivo .env encontrado"
    fi
}

# Função para iniciar serviços
start_services() {
    print_info "Iniciando serviços TrueCheckIA..."
    
    # Parar serviços existentes se estiverem rodando
    docker compose down 2>/dev/null || true
    
    # Iniciar serviços
    print_info "Iniciando containers..."
    docker compose up -d
    
    # Aguardar serviços ficarem saudáveis
    print_info "Aguardando serviços ficarem saudáveis..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local healthy_count=$(docker compose ps --format json | jq -r '.Health // "healthy"' | grep -c "healthy" || echo "0")
        local total_services=$(docker compose ps --format json | wc -l)
        
        if [ "$healthy_count" -eq "$total_services" ]; then
            print_success "Todos os serviços estão saudáveis!"
            break
        fi
        
        print_info "Tentativa $attempt/$max_attempts - $healthy_count/$total_services serviços saudáveis"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_warning "Alguns serviços podem não estar completamente saudáveis"
        print_info "Verificando status dos serviços..."
        docker compose ps
    fi
}

# Função para mostrar status
show_status() {
    print_info "Status dos serviços:"
    docker compose ps
    
    echo ""
    print_info "URLs de acesso:"
    echo "  🌐 Aplicação completa: http://localhost"
    echo "  ⚛️  Frontend direto: http://localhost:3000"
    echo "  🔗 Backend API: http://localhost:3001"
    echo "  📚 API Docs: http://localhost:3001/api-docs"
    echo "  ❤️  Health Check: http://localhost:3001/health"
    echo "  🗄️  MinIO Console: http://localhost:9001"
    
    echo ""
    print_info "Testando conectividade..."
    
    # Testar endpoints principais
    if curl -s -f http://localhost:3001/health > /dev/null; then
        print_success "Backend respondendo"
    else
        print_error "Backend não está respondendo"
    fi
    
    if curl -s -f http://localhost:3000 > /dev/null; then
        print_success "Frontend respondendo"
    else
        print_error "Frontend não está respondendo"
    fi
    
    if curl -s -f http://localhost > /dev/null; then
        print_success "Nginx proxy respondendo"
    else
        print_error "Nginx proxy não está respondendo"
    fi
}

# Função para mostrar logs
show_logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        print_info "Mostrando logs do serviço: $service"
        docker compose logs -f "$service"
    else
        print_info "Mostrando logs de todos os serviços"
        docker compose logs -f
    fi
}

# Função para parar serviços
stop_services() {
    print_info "Parando serviços TrueCheckIA..."
    docker compose down
    print_success "Serviços parados"
}

# Função para rebuild
rebuild_services() {
    print_info "Rebuild dos serviços TrueCheckIA..."
    docker compose down
    docker compose build --no-cache
    start_services
}

# Função para reset completo
reset_services() {
    print_warning "ATENÇÃO: Isso irá remover TODOS os dados (volumes, containers, etc.)"
    read -p "Tem certeza? Digite 'yes' para confirmar: " confirm
    
    if [ "$confirm" = "yes" ]; then
        print_info "Executando reset completo..."
        docker compose down -v --rmi all
        docker system prune -af
        print_success "Reset completo executado"
        print_info "Execute './start-docker.sh start' para reiniciar"
    else
        print_info "Reset cancelado"
    fi
}

# Função para executar migrations
run_migrations() {
    print_info "Executando migrations do banco..."
    docker compose exec backend npx prisma migrate deploy
    print_success "Migrations executadas"
}

# Função de ajuda
show_help() {
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start           Iniciar todos os serviços"
    echo "  stop            Parar todos os serviços"
    echo "  status          Mostrar status dos serviços"
    echo "  logs [service]  Mostrar logs (todos ou de um serviço específico)"
    echo "  rebuild         Rebuild e restart dos serviços"
    echo "  reset           Reset completo (REMOVE TODOS OS DADOS)"
    echo "  migrate         Executar migrations do banco"
    echo "  help            Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 status"
}

# Função principal
main() {
    print_header
    
    local command=${1:-"help"}
    
    case $command in
        "start")
            check_docker
            check_env
            start_services
            show_status
            ;;
        "stop")
            check_docker
            stop_services
            ;;
        "status")
            check_docker
            show_status
            ;;
        "logs")
            check_docker
            show_logs "$2"
            ;;
        "rebuild")
            check_docker
            check_env
            rebuild_services
            show_status
            ;;
        "reset")
            check_docker
            reset_services
            ;;
        "migrate")
            check_docker
            run_migrations
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Comando desconhecido: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"