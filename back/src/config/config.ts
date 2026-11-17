import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
    return {
        database: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            name: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            timezone:process.env.DB_TIMEZONE
        },
        jwt: {
            jwtSecret: process.env.JWT_SECRET
        },
        apiconfig: {
            // CANOSYS: código anterior conservado como referencia.
            // port: process.env.API_PORT || 5000
            // CANOSYS: configura la publicación central sin introducir valores propios de ENTER_TURNERO.
            port: Number(process.env.API_PORT) || 5000,
            host: process.env.API_HOST || '0.0.0.0',
            frontendPath: process.env.FRONTEND_PATH,
            // CANOSYS: mantiene los videos cargados fuera del build reemplazable del frontend.
            mediaPath: process.env.MEDIA_PATH
        }
    };
});
 
