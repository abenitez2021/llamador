import { Controller, Post, Body, Get, Put, Param, ForbiddenException, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PuntoAtencionService } from './puntoatencion.service';
import { CrearPuntoAtencionDto } from './dto/crear-puntoatencion.dto';
import { ActualizarPuntoAtencionDto } from './dto/actualizar-puntoatencion.dto';
import { InactivarPuntoDto } from './dto/inactivar-puntoatencion.dto';
import { User } from '../auth/user.decorator';
import { UsuarioEntity } from '../../entitys/usuarios.entity';

@Controller('puntoatencion')
export class PuntoAtencionController {
    constructor(private readonly puntoAtencionService: PuntoAtencionService) { }

    @Post('crear')
    async crearPuntoAtencion(@Body() dto: CrearPuntoAtencionDto) {
        return this.puntoAtencionService.crearPuntoAtencion(dto);
    }

    @Get('listar')
    async listarPuntosAtencion() {
        return this.puntoAtencionService.listarPuntosAtencion();
    }

    @Put('editar')
    async editarPuntoAtencion(@Body() dto: ActualizarPuntoAtencionDto) {
        return this.puntoAtencionService.editarPuntoAtencion(dto);
    }

    @Put('inactivar')
    async inactivarPuntoAtencion(@Body() dto: InactivarPuntoDto) {
        return this.puntoAtencionService.inactivarPuntoAtencion(dto);
    }

    // CANOSYS: recupera la última llamada persistida del operador para mantenerla después de recargar.
    @Get('ultima-llamada')
    @UseGuards(AuthGuard())
    async obtenerUltimaLlamada(@User() user: UsuarioEntity) {
        // CANOSYS: aplica la misma autorización por rol utilizada para generar llamados.
        if (![1, 5].includes(Number(user.idRol))) {
            throw new ForbiddenException('El rol no puede consultar llamados de box libre.');
        }
        return this.puntoAtencionService.obtenerUltimaLlamada(user.id);
    }

    // CANOSYS: código anterior conservado como referencia; confiaba en id_usuario enviado por el navegador.
    // async marcarDisponible(@Param('id') id: string, @Body() body: { id_usuario?: number })
    // CANOSYS: usa la identidad autenticada y autoriza por ID de rol como ENTER_TURNERO.
    @Post(':id/disponible')
    @UseGuards(AuthGuard())
    async marcarDisponible(
        @Param('id', ParseIntPipe) id_punto: number,
        @User() user: UsuarioEntity,
    ) {
        // CANOSYS: sólo Administrador (1) y Llamador (5) pueden generar avisos de box libre.
        if (![1, 5].includes(Number(user.idRol))) {
            throw new ForbiddenException('El rol no puede realizar llamados de box libre.');
        }
        return this.puntoAtencionService.marcarDisponible(id_punto, user.id);
    }

    // Lado pantalla → marcar box como ocupado después de mostrarlo
    @Post(':id/ocupado')
    async marcarOcupado(@Param('id') id: string) {
        const id_punto = Number(id);
        return this.puntoAtencionService.marcarOcupado(id_punto);
    }

    // Lado pantalla → pedir cola de boxes disponibles
    @Get('disponibles-cola')
    async disponiblesEnCola() {
        return this.puntoAtencionService.listarDisponiblesEnCola();
    }

}
