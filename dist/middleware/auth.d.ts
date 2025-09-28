import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
export interface AuthRequest extends Request {
    user?: IUser;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.d.ts.map