FROM node:18-alpine as builder

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Constrói a aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copia arquivos construídos
COPY --from=builder /app/build /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe porta
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"] 