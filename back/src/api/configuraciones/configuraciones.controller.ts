import { Body, Controller, ForbiddenException, Get, HttpCode, Logger, Post, Put, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UsuarioEntity } from 'src/entitys';
import { User } from '../auth/user.decorator';
import { ActualizarPantallaPublicaDto } from './dto/actualizar-pantalla-publica.dto';
import { ConfiguracionesService } from './configuraciones.service';
import { filtrarVideoPantalla, VideoPantallaStorage } from './video-pantalla.storage';

@Controller('configuraciones')
export class ConfiguracionesController {

    logger = new Logger('ConfiguracionesController')

    constructor(private readonly _configuracionesService: ConfiguracionesService) { }

    // CANOSYS: permite que Pantalla Pública y llamadores lean la misma duración y el medio vigente.
    @Get('pantalla-publica')
    async obtenerPantallaPublica() {
        return this._configuracionesService.obtenerPantallaPublica();
    }

    // CANOSYS: entrega el video persistente sin exponer rutas internas de la Mini PC.
    @Get('pantalla-publica/video')
    async obtenerVideoPantalla(@Res() response: Response) {
        const video = await this._configuracionesService.obtenerVideoPantalla();
        response.type(video.mime);
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return response.sendFile(video.ruta);
    }

    // CANOSYS: restringe la edición de duración al ID estable del rol Administrador.
    @Put('pantalla-publica')
    @UseGuards(AuthGuard())
    async actualizarPantallaPublica(
        @Body() dto: ActualizarPantallaPublicaDto,
        @User() user: UsuarioEntity,
    ) {
        if (Number(user.idRol) !== 1) {
            throw new ForbiddenException('Sólo Administración puede configurar la Pantalla Pública.');
        }
        return this._configuracionesService.actualizarPantallaPublica(dto, user.id);
    }

    // CANOSYS: limita el video a 500 MB y exige autenticación administrativa antes de activarlo.
    @Post('pantalla-publica/video')
    @UseGuards(AuthGuard())
    @UseInterceptors(FileInterceptor('video', {
        storage: VideoPantallaStorage,
        fileFilter: filtrarVideoPantalla,
        limits: { fileSize: 500 * 1024 * 1024 },
    }))
    async actualizarVideoPantalla(
        @UploadedFile() file: any,
        @User() user: UsuarioEntity,
    ) {
        if (Number(user.idRol) !== 1) {
            throw new ForbiddenException('Sólo Administración puede cambiar el video.');
        }
        return this._configuracionesService.actualizarVideoPantalla(file, user.id);
    }

    //Roles
    @HttpCode(200)
    @UseGuards(AuthGuard())
    @Post('rol-crear')
    async rolCrear(@User() user: UsuarioEntity
        ) {
        //return await this._configuracionesService.rolCrear(user);
    }

    //Roles
    @HttpCode(200)
    @UseGuards(AuthGuard())
    @Post('rol-listar')
    async rolListar(@User() user: UsuarioEntity
        ) {
        //return await this._configuracionesService.rolListar(user);
    }

    //Roles
    @HttpCode(200)
    @UseGuards(AuthGuard())
    @Post('rol-inactivar')
    async rolInactivar(@User() user: UsuarioEntity
        ) {
        //return await this._configuracionesService.rolInactivar(user);
    }

    //Roles
    @HttpCode(200)
    @UseGuards(AuthGuard())
    @Post('rol-actualizar')
    async rolActualizar(@User() user: UsuarioEntity
        ) {
        //return await this._configuracionesService.rolActualizar(user);
    }

}
