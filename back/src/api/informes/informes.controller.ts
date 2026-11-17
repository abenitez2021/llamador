// CANOSYS: incorpora la denegación explícita para proteger el panel de llamados por rol.
import { Body, Controller, ForbiddenException, Get, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InformesService } from './informes.service';
import { UsuarioEntity } from 'src/entitys';
import { User } from '../auth/user.decorator';

@Controller('informes')
export class InformesController {
  logger = new Logger('InformesController');

  constructor(private readonly informesService: InformesService) { }
  //aprobado
  @HttpCode(200)
  @UseGuards(AuthGuard())
  @Post('informe-movimientos')
  async informeMovimientos(@Body() filtros: any, @User() user: UsuarioEntity) {
    return await this.informesService.informeMovimientos(filtros);
  }
  //aprobado
  @HttpCode(200)
  @UseGuards(AuthGuard())
  @Post('grafico-tramites')
  async graficoTramites(@Body() filtros: any, @User() user: UsuarioEntity) {
    return await this.informesService.graficoTramites(filtros);
  }

  //aprobado
  @HttpCode(200)
  @UseGuards(AuthGuard())
  @Post('grafico-usuarios')
  async graficoUsuarios(@Body() filtros: any, @User() user: UsuarioEntity) {
    return await this.informesService.graficoUsuarios(filtros);
  }
  //aprobado
  @HttpCode(200)
  @UseGuards(AuthGuard())
  @Post('informe-tiempos-espera')
  async informeTiemposEspera(@Body() filtros: any, @User() user: UsuarioEntity) {
    return await this.informesService.informeTiemposEspera(filtros);
  }


  @Get('resumen-atencion')
  async getResumenAtencion() {
    return this.informesService.getResumenAtencion();
  }

  // CANOSYS: expone el tablero propio de ENTER_LLAMADOR únicamente a Administración y Supervisión.
  @HttpCode(200)
  @UseGuards(AuthGuard())
  @Get('resumen-llamados-box')
  async getResumenLlamadosBox(@User() user: UsuarioEntity) {
    // CANOSYS: conserva la misma matriz de IDs de rol aplicada por el frontend.
    if (![1, 6].includes(Number(user.idRol))) {
      throw new ForbiddenException('No cuenta con permiso para consultar el panel de llamados.');
    }

    return this.informesService.getResumenLlamadosBox();
  }

  // CANOSYS: expone el historial filtrable propio de ENTER_LLAMADOR para reportes y exportaciones.
  @HttpCode(200)
  @UseGuards(AuthGuard())
  @Post('historial-llamados-box')
  async getHistorialLlamadosBox(@Body() filtros: any, @User() user: UsuarioEntity) {
    // CANOSYS: aplica al informe la misma autorización administrativa del tablero.
    if (![1, 6].includes(Number(user.idRol))) {
      throw new ForbiddenException('No cuenta con permiso para consultar el historial de llamados.');
    }

    return this.informesService.getHistorialLlamadosBox(filtros);
  }

}
