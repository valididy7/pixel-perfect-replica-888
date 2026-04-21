import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface CustomEmailProps {
  html?: string
  preview?: string
}

const CustomEmail = ({ html, preview }: CustomEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{preview || 'Mensagem importante'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div dangerouslySetInnerHTML={{ __html: html || '<p>Sem conteúdo</p>' }} />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomEmail,
  subject: (data: Record<string, any>) => data?.subject || 'Mensagem',
  displayName: 'E-mail customizado',
  previewData: {
    subject: 'Exemplo de assunto',
    preview: 'Pré-visualização do e-mail',
    html: '<h1>Olá!</h1><p>Este é um e-mail customizado.</p>',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }