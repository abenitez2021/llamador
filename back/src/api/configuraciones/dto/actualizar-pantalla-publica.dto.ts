import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

// CANOSYS: valida un intervalo operativo razonable para la alerta de BOX libre.
export class ActualizarPantallaPublicaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  duracionBoxSegundos: number;
}
