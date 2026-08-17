import type { TemplateSection } from "./common-template.ts";

export type AppSummaryDef = {
  id: string;
  name: string;
  slug: string;
  folder: string;
  profileRoute: string;
  notes?: string;
  specific: TemplateSection[];
};

function s(
  title: string,
  route: string,
  stories: [string, string][],
): TemplateSection {
  return {
    title,
    route,
    kind: "specific",
    stories: stories.map(([code, text]) => ({ code, text })),
  };
}

/** Apps do workspace (sem VPN). Figma fica vazio no seed. */
export const APP_SUMMARIES: AppSummaryDef[] = [
  {
    id: "dailyfit",
    name: "dailyFit",
    slug: "dailyfit",
    folder: "daily-fit-app",
    profileRoute: "/perfil",
    specific: [
      s("Questionário", "/perguntas", [
        ["Q1", "O usuário deve conseguir ver a barra de progresso e avançar com Continuar ou voltar com Voltar."],
        ["Q2", "O usuário deve conseguir escolher o objetivo (perder peso, manter, ganhar massa ou melhorar alimentação)."],
        ["Q3", "O usuário deve conseguir informar sexo, idade, peso e altura, com aviso se algum valor for inválido."],
        ["Q4", "O usuário deve conseguir selecionar o nível de atividade e concluir o questionário (calcula a meta e vai para as tabs)."],
      ]),
      s("Início", "/", [
        ["H1", "Sem meta, o usuário deve ver o empty e usar Responder perguntas ou Definir manualmente."],
        ["H2", "O usuário deve conseguir ver calorias consumidas vs meta e os macros (proteínas, lipídios, carboidratos, fibras)."],
        ["H3", "O usuário deve conseguir adicionar alimentos por refeição (Adicionar → busca de alimento)."],
        ["H4", "Em erro de rede, o usuário deve conseguir usar Tentar novamente."],
      ]),
      s("Histórico", "/historico", [
        ["HI1", "O usuário deve conseguir filtrar por Últimos 7, 30, 90 dias ou Personalizado."],
        ["HI2", "No período personalizado, o usuário deve conseguir escolher as datas e usar Aplicar ou Limpar."],
        ["HI3", "O usuário deve conseguir ver o resumo (média kcal, dias dentro/acima/abaixo da meta) e os cards por dia."],
        ["HI4", "O usuário deve ver Sem registros neste período quando não houver dados."],
      ]),
    ],
  },
  {
    id: "equivale",
    name: "Equivale",
    slug: "equivale",
    folder: "equivale-api",
    profileRoute: "/profile",
    specific: [
      s("Categorias", "/", [
        ["H1", "O usuário deve conseguir buscar categorias no campo Buscar categoria de conversão."],
        ["H2", "O usuário deve conseguir abrir uma categoria da grade (temperatura, moeda, comprimento, peso, etc.)."],
        ["H3", "O usuário deve ver Nenhuma categoria encontrada quando a busca não retornar nada."],
      ]),
      s("Conversor", "/converter/:categoryId", [
        ["CV1", "O usuário deve conseguir digitar o valor no teclado e ver a conversão em tempo real."],
        ["CV2", "O usuário deve conseguir trocar as unidades de origem e destino."],
        ["CV3", "O usuário deve conseguir usar Trocar unidades e Voltar."],
        ["CV4", "O usuário deve ver Categoria não encontrada se o id for inválido."],
      ]),
      s("Calculadora", "/calculator", [
        ["CA1", "O usuário deve conseguir montar expressões no teclado (+, −, ×, ÷, %, parênteses)."],
        ["CA2", "O usuário deve conseguir avaliar com =, limpar com AC e ver Erro em expressão inválida."],
        ["CA3", "O usuário deve conseguir voltar para a home das tabs."],
      ]),
    ],
  },
  {
    id: "flowy",
    name: "Flowy",
    slug: "flowy",
    folder: "flowy-app",
    profileRoute: "/perfil",
    specific: [
      s("Início", "/", [
        ["H1", "No onboarding, o usuário deve conseguir informar última menstruação, dias de sangramento, duração do ciclo e método contraceptivo."],
        ["H2", "O usuário deve conseguir ver o anel do ciclo, o dia atual e a headline do dia."],
        ["H3", "O usuário deve conseguir registrar o humor em Como você se sente hoje?."],
        ["H4", "O usuário deve ver o aviso se a previsão estiver imprecisa com contraceptivo hormonal."],
      ]),
      s("Ciclo", "/ciclo", [
        ["CI1", "O usuário deve conseguir navegar o mês e selecionar um dia no calendário."],
        ["CI2", "O usuário deve conseguir ver a legenda das fases (menstruação, folicular, fértil, ovulação, lútea, TPM)."],
        ["CI3", "O usuário deve conseguir ver o humor registrado do dia selecionado."],
        ["CI4", "O usuário deve ver o erro se o calendário não carregar."],
      ]),
    ],
  },
  {
    id: "pomodoro",
    name: "pomodoro",
    slug: "pomodoro",
    folder: "pomodoro-app-v2",
    profileRoute: "/perfil",
    specific: [
      s("Foco", "/", [
        ["H1", "O usuário deve conseguir iniciar e pausar o timer de 25 minutos."],
        ["H2", "O usuário deve conseguir reiniciar o timer e cancelar o ciclo (salva sessão incompleta)."],
        ["H3", "O usuário deve conseguir mutar a música de foco e escolher o personagem nas configurações."],
        ["H4", "O usuário deve ver Sessão salva! ao concluir ou cancelar."],
      ]),
      s("Relatório", "/explore", [
        ["R1", "O usuário deve conseguir selecionar uma data e ver tempo de foco e sessões concluídas do dia."],
        ["R2", "O usuário deve conseguir ver o resumo mensal (tempo, dias de foco, melhor dia e sessões)."],
        ["R3", "O usuário deve ver o estado de carregando ou o erro se as estatísticas falharem."],
      ]),
    ],
  },
  {
    id: "sereno",
    name: "Sereno",
    slug: "sereno",
    folder: "sereno/sereno-front",
    profileRoute: "/profile",
    specific: [
      s("Músicas", "/music", [
        ["M1", "O usuário deve conseguir buscar por título, voz ou duração."],
        ["M2", "O usuário deve conseguir abrir um item da grade e ir para o player."],
        ["M3", "O usuário deve ver carregando, erro da API ou Item não encontrado na busca."],
      ]),
      s("Player", "/play", [
        ["PL1", "O usuário deve conseguir voltar, dar play/pause e pular ±15s."],
        ["PL2", "O usuário deve conseguir buscar na barra de progresso e ver o tempo atual e restante."],
        ["PL3", "No iOS, o usuário deve ver os controles ocultarem sozinhos enquanto o áudio toca."],
      ]),
    ],
  },
  {
    id: "subtracker",
    name: "SubTracker",
    slug: "subtracker",
    folder: "subtracker/subtracker-app",
    profileRoute: "/profile",
    specific: [
      s("Início", "/home", [
        ["H1", "O usuário deve conseguir ver gastos mensal, anual e média semanal."],
        ["H2", "O usuário deve conseguir ver a divisão por categoria."],
        ["H3", "O usuário deve conseguir adicionar uma assinatura pelo FAB (serviço, valor, ciclo, categoria)."],
      ]),
      s("Assinaturas", "/subscriptions", [
        ["A1", "O usuário deve conseguir filtrar por Todas, Semanais e Mensais."],
        ["A2", "O usuário deve conseguir editar e excluir uma assinatura (swipe)."],
        ["A3", "O usuário deve ver Nenhuma assinatura adicionada quando a lista estiver vazia."],
        ["A4", "O usuário deve conseguir criar uma assinatura pelo FAB."],
      ]),
    ],
  },
  {
    id: "tarefas",
    name: "tarefas",
    slug: "tarefas",
    folder: "tarefas/tarefas-app",
    profileRoute: "/profile",
    specific: [
      s("Lista de tarefas", "/", [
        ["T1", "O usuário deve conseguir navegar o dia no mini-calendário e filtrar por Todas ou por categoria."],
        ["T2", "O usuário deve conseguir marcar tarefa/subtarefa como concluída, editar e excluir (com confirmação)."],
        ["T3", "O usuário deve conseguir criar uma tarefa pelo FAB (título, categoria, hora, repetição, prioridade, lembrete, subtarefas)."],
        ["T4", "O usuário deve ver Vamos planejar seu dia? quando não houver tarefas, ou tentar de novo em erro."],
      ]),
      s("Calendário", "/calendar", [
        ["CAL1", "O usuário deve conseguir selecionar uma data no calendário mensal."],
        ["CAL2", "O usuário deve conseguir ver as tasks do dia, marcar concluídas e criar pelo FAB."],
        ["CAL3", "O usuário deve ver Nenhuma task pra esse dia quando a data não tiver tarefas."],
      ]),
    ],
  },
  {
    id: "animo",
    name: "Ânimo",
    slug: "animo",
    folder: "willian/frases-motivacionais-app",
    profileRoute: "/profile",
    specific: [
      s("Frase do dia", "/", [
        ["H1", "O usuário deve conseguir ver a saudação e a frase do dia."],
        ["H2", "O usuário deve conseguir favoritar, baixar e compartilhar a frase."],
        ["H3", "O usuário deve conseguir abrir Tema, escolher um tema e salvar."],
        ["H4", "O usuário deve ver Carregando… ou Nenhuma frase disponível quando não houver conteúdo."],
      ]),
      s("Favoritas", "/favorites", [
        ["F1", "O usuário deve conseguir ver as frases favoritas e ordenar por Mais recentes ou A-Z."],
        ["F2", "O usuário deve conseguir desfavoritar, baixar e compartilhar."],
        ["F3", "O usuário deve ver Nenhuma frase favoritada quando a lista estiver vazia."],
      ]),
    ],
  },
  {
    id: "bruxcare",
    name: "BruxCare",
    slug: "bruxcare",
    folder: "willian/bruxcare-app",
    profileRoute: "/profile",
    specific: [
      s("Registro de hoje", "/home", [
        ["H1", "O usuário deve conseguir registrar bruxismo (Sim / Não / Não sei)."],
        ["H2", "O usuário deve conseguir marcar dor na mandíbula (0–10), estresse, qualidade do sono e uso da placa."],
        ["H3", "O usuário deve conseguir configurar lembretes (ativar, escolher horário e o que lembrar)."],
        ["H4", "O usuário deve conseguir ver os cards Você sabia? com dicas."],
      ]),
      s("Histórico", "/history", [
        ["HI1", "O usuário deve conseguir filtrar por Últimos 7, 30, 90 dias ou Personalizado."],
        ["HI2", "O usuário deve conseguir ver os registros agrupados por data com os sintomas."],
        ["HI3", "O usuário deve ver Sem registros neste período quando não houver dados."],
      ]),
    ],
  },
  {
    id: "calccombu",
    name: "Cálculo Combustível",
    slug: "calccombu",
    folder: "willian/calculadora-combustivel-app",
    profileRoute: "/profile",
    specific: [
      s("Qual combustível compensa?", "/home", [
        ["H1", "O usuário deve conseguir escolher Regra dos 70% ou Cálculo preciso."],
        ["H2", "O usuário deve conseguir informar os preços de etanol e gasolina."],
        ["H3", "No modo preciso, o usuário deve informar o consumo km/l de cada combustível."],
        ["H4", "O usuário deve conseguir tocar em Calcular e ir para o resultado."],
      ]),
      s("Histórico", "/history", [
        ["HI1", "O usuário deve conseguir ver as comparações (recomendação, modo, data e preços)."],
        ["HI2", "O usuário deve conseguir abrir um item e ir para o resultado."],
        ["HI3", "O usuário deve ver Nenhuma comparação ainda quando a lista estiver vazia."],
      ]),
      s("Resultado", "/result/:id", [
        ["RS1", "O usuário deve conseguir ver o combustível recomendado e a proporção ou o custo/km."],
        ["RS2", "O usuário deve conseguir tocar em Novo cálculo e voltar para a home."],
        ["RS3", "Se o id não existir, o usuário deve ver Resultado não encontrado."],
      ]),
    ],
  },
  {
    id: "vista",
    name: "Calcular",
    slug: "vista",
    folder: "willian/calculadora-vista-parcelado-app",
    profileRoute: "/profile",
    specific: [
      s("À vista ou a prazo", "/home", [
        ["H1", "O usuário deve conseguir informar valor da compra e número de parcelas."],
        ["H2", "O usuário deve conseguir informar desconto, entrada e onde o dinheiro rende."],
        ["H3", "O usuário deve conseguir tocar em Calcular e ir para o resultado."],
      ]),
      s("Histórico", "/history", [
        ["HI1", "O usuário deve conseguir ver os cálculos agrupados por data, com vantagem e rótulo à vista/a prazo."],
        ["HI2", "O usuário deve conseguir abrir um card e ir para o resultado."],
        ["HI3", "O usuário deve ver Nenhum cálculo salvo ainda quando a lista estiver vazia."],
      ]),
      s("Resultado", "/result/:id", [
        ["RS1", "O usuário deve conseguir ver a recomendação, totais à vista/a prazo e a vantagem."],
        ["RS2", "O usuário deve conseguir tocar em Novo Cálculo e voltar para a home."],
        ["RS3", "Se o id não existir, o usuário deve ver Resultado não encontrado."],
      ]),
    ],
  },
  {
    id: "cofresenhas",
    name: "Cofre de Senhas",
    slug: "cofresenhas",
    folder: "willian/aplicativo-cofre-senhas",
    profileRoute: "/conta",
    specific: [
      s("Início", "/", [
        ["H1", "O usuário deve conseguir buscar no cofre e abrir uma categoria (Sites, Apps, Social Media, Etc, Favoritas)."],
        ["H2", "O usuário deve conseguir ver Recentes, abrir o detalhe e favoritar."],
        ["H3", "O usuário deve ver Nenhuma senha cadastrada ainda e usar Adicionar Primeira Senha."],
        ["H4", "Em falha de carga, o usuário deve conseguir usar Tentar novamente."],
      ]),
      s("Cofre", "/cofre", [
        ["CO1", "O usuário deve conseguir buscar por serviço e filtrar por Favoritos ou tags."],
        ["CO2", "O usuário deve conseguir abrir um item e criar uma senha pelo FAB."],
        ["CO3", "O usuário deve ver Nenhuma senha encontrada quando a lista estiver vazia."],
      ]),
      s("Nova senha", "/password/new", [
        ["NS1", "O usuário deve conseguir preencher plataforma e senha e salvar."],
        ["NS2", "O usuário deve conseguir gerar uma senha no bottom sheet e aplicá-la."],
        ["NS3", "O usuário deve conseguir informar credencial, tags e favorito, ou cancelar e voltar."],
      ]),
      s("Detalhe da senha", "/password/:id", [
        ["DS1", "O usuário deve conseguir ver e copiar a senha (mostrar/ocultar), e-mail, username, URL, tags e notas."],
        ["DS2", "O usuário deve conseguir editar os campos e salvar as alterações."],
        ["DS3", "O usuário deve conseguir excluir a senha com confirmação."],
      ]),
    ],
  },
  {
    id: "dosex",
    name: "DoseX",
    slug: "dosex",
    folder: "willian/dosex-app",
    profileRoute: "/profile",
    specific: [
      s("Agenda", "/home", [
        ["H1", "O usuário deve conseguir escolher um dia e ver as doses agrupadas por horário."],
        ["H2", "O usuário deve conseguir tomar, ignorar, resetar, excluir ou editar uma dose."],
        ["H3", "O usuário deve conseguir adicionar um medicamento pelo FAB (nome, dosagem, frequência, horários)."],
        ["H4", "O usuário deve ver Dia livre de remédios! quando o dia não tiver doses."],
      ]),
      s("Medicamentos", "/medications", [
        ["MD1", "O usuário deve conseguir filtrar por Todos, Tomando e Finalizados."],
        ["MD2", "O usuário deve conseguir abrir o detalhe e cadastrar um novo pelo FAB."],
        ["MD3", "O usuário deve ver Nenhum medicamento encontrado quando o filtro estiver vazio."],
      ]),
      s("Detalhe do medicamento", "/medications/:id", [
        ["MI1", "O usuário deve conseguir ver nome, dosagem, próximos lembretes e histórico (tomada/ignorada)."],
        ["MI2", "O usuário deve conseguir editar o medicamento."],
        ["MI3", "O usuário deve ver os empties se não houver lembretes futuros ou histórico."],
      ]),
    ],
  },
  {
    id: "leitorpdf",
    name: "Leitor.PDF",
    slug: "leitorpdf",
    folder: "willian/leitor-pdf-app",
    profileRoute: "/profile",
    specific: [
      s("Biblioteca", "/home", [
        ["B1", "O usuário deve conseguir filtrar por Todos, Recentes, PDF e Pasta."],
        ["B2", "O usuário deve conseguir enviar um PDF e criar uma pasta."],
        ["B3", "O usuário deve conseguir abrir pasta, PDF, pesquisa e as ações de cada item."],
        ["B4", "O usuário deve ver Nenhum arquivo ainda quando a biblioteca estiver vazia."],
      ]),
      s("Favoritos", "/favorites", [
        ["F1", "O usuário deve conseguir listar só os PDFs favoritos e ordenar por data."],
        ["F2", "O usuário deve conseguir desfavoritar e abrir as ações do PDF."],
        ["F3", "O usuário deve ver Nenhum favorito ainda quando a lista estiver vazia."],
      ]),
      s("Pesquisar", "/search", [
        ["S1", "O usuário deve conseguir buscar PDFs e ver a contagem de resultados."],
        ["S2", "O usuário deve conseguir abrir as ações de um resultado."],
        ["S3", "O usuário deve ver o empty quando a busca não retornar nada e fechar a pesquisa."],
      ]),
      s("Pasta", "/folder/:id", [
        ["PA1", "O usuário deve conseguir ver o nome da pasta, a lista de PDFs e ordenar por data."],
        ["PA2", "O usuário deve conseguir abrir pesquisa, opções da pasta e ações de um PDF."],
        ["PA3", "O usuário deve ver Pasta vazia quando não houver arquivos."],
      ]),
      s("Leitor", "/reader/:id", [
        ["LE1", "O usuário deve conseguir visualizar o PDF com zoom e restaurar a visualização."],
        ["LE2", "O usuário deve conseguir abrir as opções do PDF e tentar de novo se o arquivo falhar."],
      ]),
    ],
  },
  {
    id: "lumina",
    name: "Lumina",
    slug: "lumina",
    folder: "willian/lumina-app",
    profileRoute: "/profile",
    specific: [
      s("Início", "/home", [
        ["H1", "O usuário deve conseguir iniciar uma edição pela câmera ou galeria."],
        ["H2", "O usuário deve conseguir escolher um filtro popular e depois a fonte da imagem."],
        ["H3", "O usuário deve conseguir ver as últimas edições, abrir o detalhe e compartilhar."],
        ["H4", "O usuário deve ver Nenhuma edição ainda quando não houver histórico."],
      ]),
      s("Editor", "/editor", [
        ["E1", "O usuário deve conseguir pré-visualizar a imagem com o filtro aplicado."],
        ["E2", "O usuário deve conseguir trocar o preset e ajustar a intensidade (0–100%)."],
        ["E3", "O usuário deve conseguir salvar a edição ou voltar sem salvar."],
      ]),
    ],
  },
  {
    id: "planta",
    name: "planta.scan",
    slug: "planta",
    folder: "willian/plantas-app",
    profileRoute: "/profile",
    specific: [
      s("Início", "/", [
        ["H1", "O usuário deve conseguir iniciar a identificação pelo botão Identificar planta."],
        ["H2", "O usuário deve conseguir ver os contadores e abrir as últimas plantas identificadas."],
        ["H3", "O usuário deve ver o empty quando o histórico recente estiver vazio."],
      ]),
      s("Câmera", "/camera", [
        ["CAM1", "O usuário deve conseguir conceder a permissão da câmera se ainda não tiver."],
        ["CAM2", "O usuário deve conseguir fotografar a planta, escolher da galeria e ligar o flash."],
        ["CAM3", "O usuário deve conseguir cancelar e voltar."],
      ]),
      s("Identificando", "/loading", [
        ["LO1", "O usuário deve aguardar a identificação e ir para o detalhe se ela concluir."],
        ["LO2", "O usuário deve ir para planta não reconhecida se o app não identificar."],
        ["LO3", "O usuário deve voltar à câmera se a identificação falhar."],
      ]),
      s("Planta não reconhecida", "/not-found-plant", [
        ["NF1", "O usuário deve entender que a planta não foi reconhecida."],
        ["NF2", "O usuário deve conseguir tirar outra foto e voltar à câmera."],
      ]),
      s("Histórico", "/history", [
        ["HI1", "O usuário deve conseguir pesquisar plantas pelo nome e limpar a busca."],
        ["HI2", "O usuário deve conseguir abrir o detalhe de um item."],
        ["HI3", "O usuário deve ver o empty quando a busca não retornar resultados."],
      ]),
      s("Sobre essa planta", "/history/:id", [
        ["DP1", "O usuário deve conseguir ver foto, nomes e os cards de descrição, irrigação, luz e ambiente."],
        ["DP2", "O usuário deve conseguir excluir a planta com confirmação ou identificar outra."],
      ]),
    ],
  },
  {
    id: "quickpdf",
    name: "QuickPDF",
    slug: "quickpdf",
    folder: "willian/quickpdf-app",
    profileRoute: "/profile",
    specific: [
      s("Recentes", "/home", [
        ["H1", "O usuário deve conseguir ver os PDFs recentes e abrir o detalhe."],
        ["H2", "O usuário deve conseguir criar um PDF pelo FAB (câmera ou galeria)."],
        ["H3", "O usuário deve conseguir renomear, compartilhar, baixar, editar ou excluir."],
        ["H4", "O usuário deve ver Nenhum PDF ainda quando a lista estiver vazia."],
      ]),
      s("Arquivos", "/files", [
        ["AR1", "O usuário deve conseguir listar todos os PDFs e abrir a pesquisa."],
        ["AR2", "O usuário deve conseguir criar um PDF pelo FAB e usar as opções do arquivo."],
        ["AR3", "O usuário deve ver o empty quando não houver arquivos."],
      ]),
      s("Pesquisar", "/search", [
        ["S1", "O usuário deve conseguir buscar PDFs pelo nome e abrir o documento."],
        ["S2", "O usuário deve ver Digite para pesquisar sem query, ou Nenhum resultado se a busca falhar."],
      ]),
      s("Editor", "/editor", [
        ["E1", "O usuário deve conseguir adicionar páginas pela câmera ou galeria."],
        ["E2", "O usuário deve conseguir reordenar, girar, cortar ou excluir páginas."],
        ["E3", "O usuário deve conseguir salvar o PDF com um nome."],
      ]),
      s("Informações do documento", "/documents/:id", [
        ["DOC1", "O usuário deve conseguir ver título, páginas, tamanho e datas."],
        ["DOC2", "O usuário deve conseguir compartilhar, baixar e abrir o editor."],
      ]),
    ],
  },
  {
    id: "rotacalc",
    name: "RotaCalc",
    slug: "rotacalc",
    folder: "willian/rotacalc-app",
    profileRoute: "/profile",
    specific: [
      s("Calcular viagem", "/home", [
        ["H1", "O usuário deve conseguir escolher carro ou moto e informar origem, destino, consumo e preço do litro."],
        ["H2", "O usuário deve conseguir alternar Calcular volta e Evitar pedágios."],
        ["H3", "O usuário deve conseguir ver o custo total (combustível e pedágios) e iniciar um novo cálculo."],
      ]),
      s("Histórico", "/history", [
        ["HI1", "O usuário deve conseguir ver os cálculos anteriores (origem, destino, custo, veículo e ida/volta)."],
        ["HI2", "O usuário deve ver Nenhum cálculo ainda quando a lista estiver vazia."],
      ]),
    ],
  },
];
