import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginReqDTO {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    username: string;
    
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    password: string;
}
