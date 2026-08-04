# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL=/
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_RAZORPAY_KEY_ID=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
