export interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
  roles: string;
}
