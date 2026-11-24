import { Body, Controller, ForbiddenException, HttpException, HttpStatus, Logger, Post, UnauthorizedException, Headers } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import { PuntoAtencionService } from '../puntoatencion/puntoatencion.service';

interface PlcEventDto {
  controllerId?: string;
  box?: number;
  pin?: number;
}

@Controller('hardware')
export class HardwareController {
  private readonly logger = new Logger(HardwareController.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly puntoAtencionService: PuntoAtencionService,
  ) {}

  @Post('plc/event')
  async receivePlcEvent(
    @Headers('x-enter-plc-key') suppliedKey: string,
    @Body() body: PlcEventDto,
  ) {
    const configuredKey = process.env.ENTER_PLC_KEY;
    if (!configuredKey || configuredKey.length < 32) {
      throw new HttpException('Integración PLC no configurada', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const actual = Buffer.from(suppliedKey || '');
    const expected = Buffer.from(configuredKey);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Credencial de hardware inválida');
    }

    const controllerId = process.env.PLC_CONTROLLER_ID || 'PLC-01';
    if (!body || body.controllerId !== controllerId) {
      throw new ForbiddenException('Controlador no autorizado');
    }

    const box = body.box;
    const pin = body.pin;
    if (!Number.isInteger(box) || box < 1 || box > 8 ||
        !Number.isInteger(pin) || pin !== 29 + box) {
      throw new HttpException('Evento de PLC inválido', HttpStatus.BAD_REQUEST);
    }

    // Nunca derivar el ID MySQL del número físico. Solo configuración de servidor.
    const mapping: Record<number, number> = {};
    for (const pair of (process.env.PLC_BOX_MAP || '').split(',')) {
      const match = /^\s*([1-8]):([1-9]\d*)\s*$/.exec(pair);
      if (match) mapping[Number(match[1])] = Number(match[2]);
    }
    const puntoId = mapping[box];
    if (!puntoId) {
      throw new HttpException('BOX sin mapeo autorizado', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    const technicalUserId = Number(process.env.PLC_USUARIO_ID);
    if (!Number.isSafeInteger(technicalUserId) || technicalUserId <= 0) {
      throw new HttpException('Usuario técnico no configurado', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const rows = await this.dataSource.query(
      'SELECT id, id_rol, estado FROM usuarios WHERE id = ? LIMIT 1',
      [technicalUserId],
    );
    if (!rows.length || ![1, 5].includes(Number(rows[0].id_rol)) || rows[0].estado !== 'ACTIVO') {
      throw new HttpException('Usuario técnico inválido o inactivo', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const result = await this.puntoAtencionService.marcarDisponible(puntoId, technicalUserId);
    if (!result.ok) {
      throw new HttpException(result.message || 'BOX no disponible', HttpStatus.UNPROCESSABLE_ENTITY);
    }
    this.logger.log(`PLC ${controllerId}, BOX ${box}, pin D${pin}, punto ${puntoId}, usuario ${technicalUserId}; ya en cola: ${Boolean(result.alreadyQueued)}`);
    return { ...result, puntoId, box };
  }
}
