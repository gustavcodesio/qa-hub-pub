import type { SectionKind } from "./schema.ts";

export type TemplateStory = { code: string; text: string };

export type TemplateSection = {
  title: string;
  route: string;
  kind: SectionKind;
  stories: TemplateStory[];
};

/** Telas comuns a todos os mini-apps (títulos laranja). */
export const COMMON_SECTIONS: TemplateSection[] = [
  {
    title: "Login",
    route: "/login",
    kind: "common",
    stories: [
      {
        code: "L1",
        text: "O usuário deve conseguir informar o identificador (e-mail ou Pass ID) e a senha e entrar pelo botão Login.",
      },
      {
        code: "L2",
        text: "O usuário deve conseguir mostrar ou ocultar a senha.",
      },
      {
        code: "L3",
        text: "O usuário deve ver um erro se faltar identificador ou senha, ou se o login falhar.",
      },
      {
        code: "L4",
        text: "O usuário deve conseguir clicar em Criar conta e ir para /register.",
      },
      {
        code: "L5",
        text: "O usuário deve ver a mensagem de conta criada ao voltar do cadastro.",
      },
      {
        code: "L6",
        text: "Após o login, o usuário deve ir para / (e dali para paywall ou home).",
      },
    ],
  },
  {
    title: "Cadastro",
    route: "/register",
    kind: "common",
    stories: [
      {
        code: "C1",
        text: "O usuário deve conseguir preencher nome, e-mail, senha e confirmar senha e cadastrar.",
      },
      {
        code: "C2",
        text: "O usuário deve ver erro se faltar campo, se a senha tiver menos de 6 caracteres ou se as senhas não coincidirem.",
      },
      {
        code: "C3",
        text: "O usuário deve ver o erro da API se o cadastro falhar.",
      },
      {
        code: "C4",
        text: "O usuário deve conseguir clicar em Já tem conta? Login e ir para /login.",
      },
      {
        code: "C5",
        text: "Após o cadastro, o usuário deve ir para /login com a mensagem de conta criada.",
      },
    ],
  },
  {
    title: "Paywall",
    route: "/paywall",
    kind: "common",
    stories: [
      {
        code: "PW1",
        text: "O usuário deve conseguir ver o paywall e assinar.",
      },
      {
        code: "PW2",
        text: "O usuário deve conseguir restaurar compras.",
      },
      {
        code: "PW3",
        text: "O usuário deve conseguir clicar em Sair / usar outra conta, fazer logout e ir para /login.",
      },
      {
        code: "PW4",
        text: "Se já for Pro, o usuário deve ir para a home.",
      },
      {
        code: "PW5",
        text: "Se a assinatura não estiver configurada, o usuário deve ver o aviso e clicar em Continuar.",
      },
    ],
  },
  {
    title: "Perfil",
    route: "/perfil",
    kind: "common",
    stories: [
      {
        code: "P1",
        text: "O usuário deve conseguir ver nome, identificador e foto.",
      },
      {
        code: "P2",
        text: "O usuário deve conseguir alterar o nome e salvar.",
      },
      {
        code: "P3",
        text: "O usuário deve conseguir clicar em Cancelar e desfazer a edição.",
      },
      {
        code: "P4",
        text: "O usuário deve conseguir trocar a foto pela galeria (o app pede permissão).",
      },
      {
        code: "P5",
        text: "O usuário deve conseguir alterar a senha (senha atual e nova senha).",
      },
      {
        code: "P6",
        text: "O usuário deve conseguir sair da conta (confirmação no drawer) e ir para /login.",
      },
      {
        code: "P7",
        text: "O usuário deve conseguir navegar pela barra inferior do app.",
      },
      {
        code: "P8",
        text: "Sem sessão, o usuário deve ser redirecionado para /login.",
      },
    ],
  },
];

export function commonSectionsFor(profileRoute: string): TemplateSection[] {
  return COMMON_SECTIONS.map((section) =>
    section.title === "Perfil" ? { ...section, route: profileRoute } : section,
  );
}

/** Login/Cadastro/Paywall, telas específicas, Perfil por último. */
export function sectionsWithProfileLast(
  commons: TemplateSection[],
  specific: TemplateSection[],
): TemplateSection[] {
  return [
    ...commons.filter((section) => section.title !== "Perfil"),
    ...specific,
    ...commons.filter((section) => section.title === "Perfil"),
  ];
}
