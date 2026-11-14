import { PartialType } from '@nestjs/swagger';
import { CreateLinkDto } from './create-link.dto.js';

export class UpdateLinkDto extends PartialType(CreateLinkDto) {}
