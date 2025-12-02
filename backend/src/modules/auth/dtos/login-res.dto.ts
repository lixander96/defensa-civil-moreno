import { Expose } from "class-transformer";

export class LoginResDTO {
    @Expose()
    id: number;

    @Expose()
    username: string;
    
    @Expose()
    access_token: string;
}
