import { BadRequestException } from "@nestjs/common";
import { ValidationError } from "class-validator";

type ValidationDetail = {
  field: string;
  message: string;
};

const fieldLabels: Record<string, string> = {
  name: "nome",
  email: "e-mail",
  password: "senha",
  phone: "telefone",
  companyName: "nome da empresa",
  cauNumber: "número do CAU",
  website: "site",
  bio: "biografia",
  title: "título",
  excerpt: "resumo",
  content: "conteúdo",
  author: "autor",
  imageUrl: "imagem",
  description: "descrição",
  address: "endereço",
  neighborhood: "bairro",
  city: "cidade",
  state: "estado",
  zipCode: "CEP",
  areaM2: "área",
  price: "valor",
  projectId: "projeto",
  terrainId: "terreno",
  refreshToken: "token de atualização",
  limit: "limite",
  page: "página",
  status: "status",
  role: "perfil"
};

function labelFor(field: string) {
  return fieldLabels[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function numberFrom(message: string) {
  return message.match(/\d+(?:\.\d+)?/)?.[0];
}

function translateConstraint(
  constraint: string,
  originalMessage: string,
  property: string,
  value: unknown
) {
  const field = labelFor(property);
  const amount = numberFrom(originalMessage);
  const required = value === undefined || value === null || value === "";

  if (required && ["isString", "isEmail", "isNumber", "isEnum", "isBoolean", "isArray"].includes(constraint)) {
    return `O campo ${field} é obrigatório.`;
  }

  switch (constraint) {
    case "isDefined":
    case "isNotEmpty":
      return `O campo ${field} é obrigatório.`;
    case "isEmail":
      return `Informe um e-mail válido.`;
    case "isString":
      return `O campo ${field} deve ser um texto.`;
    case "minLength":
      return `O campo ${field} deve ter no mínimo ${amount ?? "o número exigido de"} caracteres.`;
    case "maxLength":
      return `O campo ${field} deve ter no máximo ${amount ?? "o número permitido de"} caracteres.`;
    case "isEnum":
      return `Selecione uma opção válida para ${field}.`;
    case "isNumber":
      return `O campo ${field} deve ser um número válido.`;
    case "isInt":
      return `O campo ${field} deve ser um número inteiro.`;
    case "min":
      return `O campo ${field} deve ser maior ou igual a ${amount ?? "o mínimo permitido"}.`;
    case "max":
      return `O campo ${field} deve ser menor ou igual a ${amount ?? "o máximo permitido"}.`;
    case "isBoolean":
      return `O campo ${field} deve ser verdadeiro ou falso.`;
    case "isArray":
      return `O campo ${field} deve ser uma lista.`;
    case "arrayMinSize":
      return `Selecione pelo menos ${amount ?? "a quantidade mínima de"} itens em ${field}.`;
    case "isUrl":
      return `Informe uma URL válida para ${field}.`;
    case "isUUID":
      return `O campo ${field} possui um identificador inválido.`;
    case "whitelistValidation":
      return `O campo ${field} não é permitido.`;
    default:
      return `O campo ${field} é inválido.`;
  }
}

function flattenValidationErrors(errors: ValidationError[], parent = ""): ValidationDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const ownDetails = Object.entries(error.constraints ?? {}).map(([constraint, message]) => ({
      field,
      message: translateConstraint(constraint, message, error.property, error.value)
    }));
    const childDetails = error.children?.length
      ? flattenValidationErrors(error.children, field)
      : [];

    return [...ownDetails, ...childDetails];
  });
}

export function validationExceptionFactory(errors: ValidationError[]) {
  const details = flattenValidationErrors(errors);
  const messages = [...new Set(details.map((detail) => detail.message))];

  return new BadRequestException({
    message: messages,
    error: "Dados inválidos",
    details
  });
}
