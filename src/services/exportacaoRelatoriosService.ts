import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DashboardModularMetrics } from '@/types/dashboard'
import { FiltrosGerais } from '@/components/dashboard/DashboardFiltrosAvancados'

// ============================================================================
// INTERFACES DE EXPORTAÇÃO
// ============================================================================

export interface DadosRelatorio {
  titulo: string
  periodo: string
  dataGeracao: string
  filtrosAplicados: string[]
  metricas: DashboardModularMetrics
  resumoExecutivo: ResumoExecutivo
  insights: string[]
  recomendacoes: string[]
}

export interface ResumoExecutivo {
  totalVendas: number
  totalComandas: number
  ticketMedio: number
  crescimentoVendas: number
  profissionaisAtivos: number
  clientesAtendidos: number
  melhorDia: string
  horarioPico: string
}

export interface ConfigExportacao {
  incluirGraficos: boolean
  incluirDetalhamento: boolean
  incluirInsights: boolean
  incluirRecomendacoes: boolean
  formatoData: 'completo' | 'resumido'
  idioma: 'pt-BR'
}

// ============================================================================
// SERVIÇO DE EXPORTAÇÃO
// ============================================================================

export class ExportacaoRelatoriosService {

  /**
   * Gera dados estruturados para relatório
   */
  gerarDadosRelatorio(
    metricas: DashboardModularMetrics,
    filtros: FiltrosGerais,
    config: ConfigExportacao
  ): DadosRelatorio {
    const agora = new Date()
    const periodo = this.formatarPeriodo(filtros.periodo)
    
    return {
      titulo: 'Relatório Dashboard - Sistema Bello',
      periodo,
      dataGeracao: format(agora, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      filtrosAplicados: this.formatarFiltros(filtros),
      metricas,
      resumoExecutivo: this.gerarResumoExecutivo(metricas),
      insights: this.gerarInsights(metricas),
      recomendacoes: this.gerarRecomendacoes(metricas)
    }
  }

  /**
   * Exporta relatório em PDF
   */
  async exportarPDF(dados: DadosRelatorio, config: ConfigExportacao): Promise<void> {
    try {
      // Simulação da geração de PDF
      // Em produção, usar biblioteca como jsPDF, Puppeteer ou html2pdf
      
      const conteudo = this.gerarConteudoPDF(dados, config)
      
      // Criar blob e download
      const blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-dashboard-${format(new Date(), 'yyyy-MM-dd-HHmm')}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      console.log('PDF exportado com sucesso')
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw new Error('Falha na exportação do PDF')
    }
  }

  /**
   * Exporta relatório em Excel
   */
  async exportarExcel(dados: DadosRelatorio, config: ConfigExportacao): Promise<void> {
    try {
      // Simulação da geração de Excel
      // Em produção, usar biblioteca como xlsx ou exceljs
      
      const workbook = this.gerarWorkbookExcel(dados, config)
      
      // Criar CSV como simulação
      const csv = this.gerarCSV(dados)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-dashboard-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      console.log('Excel exportado com sucesso')
      
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      throw new Error('Falha na exportação do Excel')
    }
  }

  /**
   * Exporta relatório em CSV
   */
  async exportarCSV(dados: DadosRelatorio, config: ConfigExportacao): Promise<void> {
    try {
      const csv = this.gerarCSV(dados)
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-dashboard-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      console.log('CSV exportado com sucesso')
      
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      throw new Error('Falha na exportação do CSV')
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS DE FORMATAÇÃO
  // ============================================================================

  private formatarPeriodo(periodo: FiltrosGerais['periodo']): string {
    const { preset, dataInicio, dataFim } = periodo
    
    switch (preset) {
      case 'hoje':
        return 'Hoje'
      case 'ontem':
        return 'Ontem'
      case 'semana':
        return 'Esta Semana'
      case 'mes':
        return 'Este Mês'
      case 'trimestre':
        return 'Trimestre Atual'
      case 'personalizado':
        if (dataInicio && dataFim) {
          return `${format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dataFim, 'dd/MM/yyyy', { locale: ptBR })}`
        }
        return 'Período Personalizado'
      default:
        return 'Período não especificado'
    }
  }

  private formatarFiltros(filtros: FiltrosGerais): string[] {
    const filtrosAtivos: string[] = []
    
    // Período
    filtrosAtivos.push(`Período: ${this.formatarPeriodo(filtros.periodo)}`)
    
    // Comparação
    if (filtros.periodo.compararCom) {
      const comparacao = {
        'periodo_anterior': 'Período anterior',
        'mes_passado': 'Mês passado',
        'semana_passada': 'Semana passada',
        'ano_passado': 'Ano passado'
      }
      filtrosAtivos.push(`Comparação: ${comparacao[filtros.periodo.compararCom]}`)
    }
    
    // Profissionais
    if (filtros.profissionais.selecionados.length > 0) {
      filtrosAtivos.push(`Profissionais: ${filtros.profissionais.selecionados.length} selecionados`)
    }
    
    // Métricas
    if (filtros.analise.metricas.length > 0) {
      filtrosAtivos.push(`Métricas: ${filtros.analise.metricas.join(', ')}`)
    }
    
    // Agrupamento
    filtrosAtivos.push(`Agrupamento: ${filtros.analise.agruparPor}`)
    
    // Busca
    if (filtros.busca) {
      filtrosAtivos.push(`Busca: "${filtros.busca}"`)
    }
    
    return filtrosAtivos
  }

  private gerarResumoExecutivo(metricas: DashboardModularMetrics): ResumoExecutivo {
    if (!metricas.executivas) {
      return {
        totalVendas: 0,
        totalComandas: 0,
        ticketMedio: 0,
        crescimentoVendas: 0,
        profissionaisAtivos: 0,
        clientesAtendidos: 0,
        melhorDia: 'N/A',
        horarioPico: 'N/A'
      }
    }

    const { executivas } = metricas
    
    return {
      totalVendas: executivas.vendas.totalDia,
      totalComandas: executivas.comandas.quantidadeHoje,
      ticketMedio: executivas.comandas.ticketMedio,
      crescimentoVendas: executivas.vendas.percentualVsOntem,
      profissionaisAtivos: executivas.profissionaisAtivos.totalAtivos,
      clientesAtendidos: executivas.clientes.totalAtivos,
      melhorDia: 'N/A',
      horarioPico: '14h-16h' // Simulado - em produção viria dos dados
    }
  }

  private gerarInsights(metricas: DashboardModularMetrics): string[] {
    const insights: string[] = []
    
    if (!metricas.executivas) return insights
    
    const { executivas } = metricas
    
    // Análise de crescimento
    if (executivas.vendas.percentualVsOntem > 10) {
      insights.push(`Excelente crescimento de vendas: +${executivas.vendas.percentualVsOntem.toFixed(1)}% vs ontem`)
    } else if (executivas.vendas.percentualVsOntem < -10) {
      insights.push(`Queda significativa nas vendas: ${executivas.vendas.percentualVsOntem.toFixed(1)}% vs ontem`)
    }
    
    // Análise de ticket médio
    if (executivas.comandas.ticketMedio > 100) {
      insights.push(`Ticket médio elevado: R$ ${executivas.comandas.ticketMedio.toFixed(2)}`)
    }
    
    // Análise de meta
    if (executivas.vendas.metaDiaria) {
      const percentual = executivas.vendas.percentualMeta
      if (percentual >= 100) {
        insights.push(`Meta diária atingida: ${percentual.toFixed(1)}%`)
      } else if (percentual >= 80) {
        insights.push(`Próximo da meta diária: ${percentual.toFixed(1)}%`)
      } else {
        insights.push(`Meta diária em risco: apenas ${percentual.toFixed(1)}%`)
      }
    }
    
    // Análise de ocupação
    if (executivas.profissionaisAtivos.ocupacaoMedia > 80) {
      insights.push(`Alta ocupação dos profissionais: ${executivas.profissionaisAtivos.ocupacaoMedia}%`)
    }
    
    return insights
  }

  private gerarRecomendacoes(metricas: DashboardModularMetrics): string[] {
    const recomendacoes: string[] = []
    
    if (!metricas.executivas) return recomendacoes
    
    const { executivas } = metricas
    
    // Recomendações baseadas em vendas
    if (executivas.vendas.percentualVsOntem < -10) {
      recomendacoes.push('Implementar ações promocionais para reverter queda nas vendas')
      recomendacoes.push('Analisar concorrência e ajustar estratégia de preços')
    }
    
    // Recomendações baseadas em ticket médio
    if (executivas.comandas.ticketMedio < 50) {
      recomendacoes.push('Capacitar equipe para vendas complementares (upselling)')
      recomendacoes.push('Criar pacotes de serviços para aumentar ticket médio')
    }
    
    // Recomendações baseadas em ocupação
    if (executivas.profissionaisAtivos.ocupacaoMedia < 60) {
      recomendacoes.push('Otimizar agenda dos profissionais para melhor ocupação')
      recomendacoes.push('Implementar campanhas para horários de menor movimento')
    }
    
    // Recomendações baseadas em meta
    if (executivas.vendas.metaDiaria && executivas.vendas.percentualMeta < 70) {
      recomendacoes.push('Revisar metas diárias para torná-las mais realistas')
      recomendacoes.push('Implementar sistema de bonificação para alcance de metas')
    }
    
    // Recomendações gerais
    recomendacoes.push('Manter monitoramento constante das métricas principais')
    recomendacoes.push('Realizar análise semanal para identificar tendências')
    
    return recomendacoes
  }

  private gerarConteudoPDF(dados: DadosRelatorio, config: ConfigExportacao): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dados.titulo}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1976d2; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1976d2; }
        .metric-label { font-size: 12px; color: #666; }
        .insight { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${dados.titulo}</h1>
        <p><strong>Período:</strong> ${dados.periodo}</p>
        <p><strong>Gerado em:</strong> ${dados.dataGeracao}</p>
    </div>
    
    <div class="section">
        <h2>📊 Resumo Executivo</h2>
        <div class="metric">
            <div class="metric-value">R$ ${dados.resumoExecutivo.totalVendas.toLocaleString('pt-BR')}</div>
            <div class="metric-label">Total de Vendas</div>
        </div>
        <div class="metric">
            <div class="metric-value">${dados.resumoExecutivo.totalComandas}</div>
            <div class="metric-label">Total de Comandas</div>
        </div>
        <div class="metric">
            <div class="metric-value">R$ ${dados.resumoExecutivo.ticketMedio.toFixed(2)}</div>
            <div class="metric-label">Ticket Médio</div>
        </div>
        <div class="metric">
            <div class="metric-value">${dados.resumoExecutivo.profissionaisAtivos}</div>
            <div class="metric-label">Profissionais Ativos</div>
        </div>
    </div>
    
    <div class="section">
        <h2>🔍 Filtros Aplicados</h2>
        <ul>
            ${dados.filtrosAplicados.map(filtro => `<li>${filtro}</li>`).join('')}
        </ul>
    </div>
    
    ${config.incluirInsights ? `
    <div class="section">
        <h2>💡 Insights Identificados</h2>
        ${dados.insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
    </div>
    ` : ''}
    
    ${config.incluirRecomendacoes ? `
    <div class="section">
        <h2>🎯 Recomendações</h2>
        <ul>
            ${dados.recomendacoes.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Relatório gerado pelo Sistema Bello - Dashboard Analytics</p>
        <p>Para mais informações, acesse o dashboard completo do sistema</p>
    </div>
</body>
</html>
    `.trim()
  }

  private gerarWorkbookExcel(dados: DadosRelatorio, config: ConfigExportacao): any {
    // Simulação da estrutura Excel
    // Em produção, usar biblioteca xlsx ou similar
    return {
      sheets: {
        'Resumo': dados.resumoExecutivo,
        'Insights': dados.insights,
        'Recomendações': dados.recomendacoes,
        'Filtros': dados.filtrosAplicados
      }
    }
  }

  private gerarCSV(dados: DadosRelatorio): string {
    const linhas = [
      // Header
      'RELATÓRIO DASHBOARD - SISTEMA BELLO',
      `Período:,${dados.periodo}`,
      `Gerado em:,${dados.dataGeracao}`,
      '',
      
      // Resumo Executivo
      'RESUMO EXECUTIVO',
      'Métrica,Valor',
      `Total de Vendas,R$ ${dados.resumoExecutivo.totalVendas.toLocaleString('pt-BR')}`,
      `Total de Comandas,${dados.resumoExecutivo.totalComandas}`,
      `Ticket Médio,R$ ${dados.resumoExecutivo.ticketMedio.toFixed(2)}`,
      `Crescimento Vendas,${dados.resumoExecutivo.crescimentoVendas.toFixed(1)}%`,
      `Profissionais Ativos,${dados.resumoExecutivo.profissionaisAtivos}`,
      `Clientes Atendidos,${dados.resumoExecutivo.clientesAtendidos}`,
      `Melhor Dia,${dados.resumoExecutivo.melhorDia}`,
      `Horário Pico,${dados.resumoExecutivo.horarioPico}`,
      '',
      
      // Filtros
      'FILTROS APLICADOS',
      ...dados.filtrosAplicados.map(filtro => filtro.replace(',', ';')),
      '',
      
      // Insights
      'INSIGHTS IDENTIFICADOS',
      ...dados.insights.map(insight => insight.replace(',', ';')),
      '',
      
      // Recomendações
      'RECOMENDAÇÕES',
      ...dados.recomendacoes.map(rec => rec.replace(',', ';'))
    ]
    
    return linhas.join('\n')
  }
}

// Instância singleton
export const exportacaoRelatoriosService = new ExportacaoRelatoriosService()
export default exportacaoRelatoriosService 