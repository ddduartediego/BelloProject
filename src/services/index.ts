// Exportação centralizada de todos os services
export * from './base.service'
export * from './empresa.service'
export * from './clientes.service'
export * from './profissionais.service'
export * from './servicos.service'
export * from './agendamentos.service'

// Exportações padrão para facilitar o uso
export { default as empresaService } from './empresa.service'
export { default as clientesService } from './clientes.service'
export { default as profissionaisService } from './profissionais.service'
export { default as servicosService } from './servicos.service'
export { default as agendamentosService } from './agendamentos.service'
export { default as usuariosService } from './usuarios.service'

// Exportar tipos
export type { CreateAgendamentoData, UpdateAgendamentoData, AgendamentoFilters } from './agendamentos.service'
export type { CreateClienteData, UpdateClienteData, ClienteFilters } from './clientes.service'
export type { CreateEmpresaData, UpdateEmpresaData } from './empresa.service'
export type { CreateProfissionalData, UpdateProfissionalData, ProfissionalFilters, ProfissionalComUsuario } from './profissionais.service'
export type { CreateServicoData, UpdateServicoData, ServicoFilters } from './servicos.service'
export type { CreateUsuarioData, UpdateUsuarioData } from './usuarios.service' 