import { IsUUID, IsInt, Min, Max, Matches, IsNotEmpty } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateScheduleEntryDto {
  @IsUUID()
  program_id: string;

  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @Matches(TIME_REGEX)
  start_time: string; // HH:MM

  @Matches(TIME_REGEX)
  end_time: string; // HH:MM
}
