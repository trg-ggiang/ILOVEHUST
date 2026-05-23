declare global {
  namespace Express {
    interface AuthUser {
      id: number;
      role: number;
      email: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
