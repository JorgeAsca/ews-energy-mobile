export interface ICliente {
  Id?: number;
  Title: string; 
  EmpresaRelacionada?: string; 
  CIF?: string;
  Direccion?: string;
  Email?: string;
  Telefono?: string; // <--- Change to the real internal name
}