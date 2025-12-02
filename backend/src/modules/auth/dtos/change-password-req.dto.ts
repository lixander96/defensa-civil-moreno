import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordReqDTO {
    @IsString()
    @MinLength(6)
    @ApiProperty()
    oldPassword: string;

    @IsString()
    @MinLength(6)
    @ApiProperty()
    newPassword: string;
}
