from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether

OUT = 'output/pdf/Raisa_Meta_Messaging_Setup_Guide.pdf'
gold = colors.HexColor('#B78B22')
ink = colors.HexColor('#171512')
green = colors.HexColor('#2F785C')
red = colors.HexColor('#9B2C2C')
pale = colors.HexColor('#F7F2E8')
bluepale = colors.HexColor('#EDF5FA')
muted = colors.HexColor('#625E57')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleBrand', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=26, leading=31, textColor=ink, alignment=TA_CENTER, spaceAfter=9))
styles.add(ParagraphStyle(name='Sub', parent=styles['Normal'], fontSize=11, leading=16, textColor=muted, alignment=TA_CENTER, spaceAfter=9))
styles.add(ParagraphStyle(name='H1Brand', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=ink, spaceBefore=15*mm, spaceAfter=8, keepWithNext=0))
styles.add(ParagraphStyle(name='H2Brand', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=gold, spaceBefore=9, spaceAfter=5))
styles.add(ParagraphStyle(name='BodyBrand', parent=styles['BodyText'], fontSize=9.5, leading=14, textColor=ink, spaceAfter=5))
styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontSize=8.2, leading=11.5, textColor=ink, spaceAfter=3))
styles.add(ParagraphStyle(name='Step', parent=styles['BodyText'], fontSize=9.6, leading=14.4, leftIndent=7*mm, firstLineIndent=-6*mm, spaceAfter=5, textColor=ink))
styles.add(ParagraphStyle(name='Check', parent=styles['BodyText'], fontSize=9.3, leading=13.5, leftIndent=6*mm, firstLineIndent=-5*mm, spaceAfter=4, textColor=ink))

def p(text, style='BodyBrand'):
    return Paragraph(text, styles[style])

def box(title, body, color=pale, border=gold):
    t = Table([[p(f'<b>{title}</b><br/>{body}', 'BodyBrand')]], colWidths=[174*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('BOX',(0,0),(-1,-1),0.8,border),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return t

def step(n, text):
    return p(f'<b>{n}.</b> {text}', 'Step')

def check(text):
    return p(f'[ ] {text}', 'Check')

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(gold); canvas.setLineWidth(0.5)
    canvas.line(18*mm, A4[1]-14*mm, A4[0]-18*mm, A4[1]-14*mm)
    canvas.setFont('Helvetica', 7.5); canvas.setFillColor(muted)
    canvas.drawString(18*mm, 9*mm, 'USE ME WITH STYLE  |  META MESSAGING SETUP FOR RAISA')
    canvas.drawRightString(A4[0]-18*mm, 9*mm, f'30 July 2026  |  Page {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=27*mm, bottomMargin=16*mm, title='Raisa - Meta Messaging Setup Guide', author='Use Me With Style')
story = [Spacer(1, 19*mm), p('USE ME WITH STYLE', 'Sub'), p('Guia para ativar WhatsApp e Instagram', 'TitleBrand'),
         p('Instruções detalhadas para Raisa - sem conhecimentos técnicos necessários', 'Sub'), Spacer(1, 5*mm),
         box('Objetivo deste guia', 'Preparar a conta Meta da cliente para que a equipa técnica possa terminar as mensagens automáticas do WhatsApp e Instagram no site. Raisa fará apenas a parte de propriedade, autorização e verificação. A equipa técnica fará o código, webhook, tokens, Railway e testes.'),
         Spacer(1, 6*mm),
         box('Regra de segurança mais importante', '<b>Nunca envie a palavra-passe do Facebook/Instagram/WhatsApp, códigos de SMS, App Secret ou access tokens por email, WhatsApp ou mensagem.</b> Raisa deve entrar na própria conta e conceder acesso à pessoa certa. Códigos de verificação devem ser introduzidos pela própria Raisa na página oficial da Meta.', colors.HexColor('#FCECEC'), red),
         p('O que já confirmámos', 'H1Brand')]

known = [
['Ativo', 'Confirmado'],
['Portefólio Meta Business', 'Use Me - Business ID 251271330097421'],
['Página Facebook', 'Use Me - Page ID 251242313433656'],
['Instagram', '@use_me_withstyle'],
['WhatsApp Business', 'Existem as contas “Use Me With Style” e “Raisa Bandeira”'],
['Pessoa técnica já no negócio', 'José Paulo Rodrigues Nogueira - jose_exblade@me.com'],
['Webhook final', 'https://cms.usemewithstyle.shop/api/messaging-webhook'],
]
t = Table([[p(c,'Small') for c in row] for row in known], colWidths=[48*mm,126*mm], repeatRows=1)
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),ink),('TEXTCOLOR',(0,0),(-1,0),colors.white),('GRID',(0,0),(-1,-1),0.35,colors.HexColor('#D8D2C5')),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,pale]),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
story += [t, Spacer(1,4*mm), p('<b>Tempo estimado para Raisa:</b> 25-45 minutos se os acessos e o número de telefone estiverem disponíveis. Algumas aprovações da Meta podem demorar mais e não dependem da equipa.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Antes de começar', 'H1Brand'),
          box('Use um computador', 'Faça estes passos num computador, de preferência no Google Chrome. Não recomendamos fazer a configuração inicial apenas pelo telemóvel.'),
          p('Tenha consigo:', 'H2Brand'),
          check('A palavra-passe da conta Facebook pessoal de Raisa que administra o negócio “Use Me”.'),
          check('O telemóvel onde Raisa recebe os códigos de autenticação da conta Meta.'),
          check('Acesso ao número WhatsApp que será usado pela loja, incluindo possibilidade de receber SMS ou chamada.'),
          check('Acesso ao Instagram @use_me_withstyle.'),
          check('Nome legal da empresa: Prime Essencial - Comércio e Prestação de Serviços, LDA.'),
          check('NIF angolano: 5002772817.'),
          check('Website: https://www.usemewithstyle.shop'),
          p('Decisão que Raisa deve confirmar antes de mexer no WhatsApp', 'H2Brand'),
          box('Qual número vamos usar?', 'A equipa tem o número de apoio <b>+244 933 617 878</b>. Raisa deve confirmar por escrito se este é o número oficial que deve receber as mensagens automáticas. Também deve confirmar qual conta WhatsApp Business é a correta: <b>Use Me With Style</b> ou <b>Raisa Bandeira</b>. Não adivinhar.', bluepale, colors.HexColor('#4B87A6')),
          box('Não remover o WhatsApp atual', 'Não apague a conta WhatsApp, não desinstale a aplicação e não aceite “migrar” ou “transferir” o número sem falar com a equipa técnica. Uma migração errada pode interromper as conversas atuais. Se a Meta oferecer “coexistência”, pare e envie uma captura de ecrã para a equipa decidir.', colors.HexColor('#FFF4E5'), colors.HexColor('#C87913')),
          p('Ativar segurança da conta', 'H2Brand'),
          step(1, 'Abra <link href="https://accountscenter.facebook.com/password_and_security/">accountscenter.facebook.com/password_and_security/</link>.'),
          step(2, 'Escolha <b>Autenticação de dois fatores</b> / <b>Two-factor authentication</b>.'),
          step(3, 'Ative para a conta Facebook de Raisa. Prefira uma aplicação autenticadora; SMS também é aceitável.'),
          step(4, 'Guarde os códigos de recuperação num local privado. Não os envie à equipa.'),
          box('Ponto de controlo', 'Só continue quando Raisa conseguir entrar no Facebook e receber um código de segurança sem ajuda de outra pessoa.', colors.HexColor('#EAF6EF'), green), PageBreak(), Spacer(1, 9*mm)]

story += [p('Parte 1 - Registar Raisa no Meta for Developers', 'H1Brand'),
          p('Este registo é necessário para criar a aplicação que liga o site ao WhatsApp e Instagram. Não é uma nova rede social e não publica nada no perfil pessoal.'),
          step(1, 'Entre primeiro em <link href="https://www.facebook.com/">facebook.com</link> com a conta Facebook pessoal de Raisa.'),
          step(2, 'Noutra aba, abra <link href="https://developers.facebook.com/">developers.facebook.com</link>.'),
          step(3, 'No canto superior direito, procure <b>Começar</b>, <b>Get Started</b> ou <b>Register</b>.'),
          step(4, 'Aceite os termos da Plataforma Meta apenas depois de confirmar que o endereço começa por <b>https://developers.facebook.com/</b>.'),
          step(5, 'Se for solicitado, confirme a palavra-passe do Facebook e o código enviado ao telemóvel de Raisa.'),
          step(6, 'Escolha a finalidade mais próxima de <b>Developer / Programador</b> ou <b>Business / Empresa</b>. Esta seleção não altera a loja.'),
          step(7, 'Quando terminar, deve aparecer <b>My Apps / As minhas apps</b> no topo.'),
          box('Se aparecer “Não tens acesso”', 'Confirme que Raisa entrou com o perfil Facebook pessoal correto, não apenas com o perfil Instagram. Tente uma janela privada do Chrome. Se continuar, tire uma captura completa do erro e envie à equipa - sem mostrar palavras-passe ou códigos.', colors.HexColor('#FFF4E5'), colors.HexColor('#C87913')),
          p('O que enviar à equipa nesta fase', 'H2Brand'),
          check('Uma captura da página “My Apps / As minhas apps”, sem segredos visíveis.'),
          check('A frase: “Consegui concluir o registo Meta for Developers”.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Parte 2 - Criar a aplicação da loja', 'H1Brand'),
          p('Os nomes dos botões podem mudar ligeiramente. Use a equivalência portuguesa/inglesa indicada abaixo.'),
          step(1, 'Em <link href="https://developers.facebook.com/apps/">developers.facebook.com/apps/</link>, clique <b>Create App / Criar app</b>.'),
          step(2, 'Se a Meta perguntar o caso de uso, escolha <b>Other / Outro</b>, <b>Business / Empresa</b>, ou uma opção que mencione gerir mensagens empresariais. Não escolha jogos.'),
          step(3, 'Se aparecer “App type / Tipo de app”, escolha <b>Business / Empresa</b>.'),
          step(4, 'Preencha <b>App name / Nome da app</b>: <b>Use Me With Style Messaging</b>.'),
          step(5, 'Preencha o email de contacto com um endereço controlado pela cliente. Use <b>support@usemewithstyle.shop</b> se a Meta aceitar; caso contrário use o email principal da conta e alteramos depois.'),
          step(6, 'Em <b>Business portfolio / Portefólio de negócios</b>, selecione <b>Use Me</b> - ID <b>251271330097421</b>.'),
          step(7, 'Clique <b>Create App / Criar app</b>. Pode ser necessário confirmar novamente a palavra-passe.'),
          step(8, 'Na página inicial da app, copie apenas o <b>App ID</b>. O App ID não é secreto.'),
          box('Não partilhar o App Secret', 'Se a página mostrar <b>App Secret</b>, não clique “Show / Mostrar” e não envie esse valor. A equipa técnica terá acesso seguro depois de ser adicionada à app.', colors.HexColor('#FCECEC'), red),
          p('Informação a enviar à equipa', 'H2Brand'),
          check('App ID (apenas o número público).'),
          check('Captura do painel mostrando o nome “Use Me With Style Messaging” e o portefólio “Use Me”.'),
          check('Confirmação de que a app pertence à empresa, e não a uma conta pessoal isolada.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Parte 3 - Dar acesso à equipa técnica', 'H1Brand'),
          box('Esta é a parte principal', 'Quando José estiver adicionado à app e aos ativos, Raisa não precisa gerar tokens nem configurar URLs técnicas. A equipa conclui esses passos.'),
          p('A. Confirmar acesso ao portefólio', 'H2Brand'),
          step(1, 'Abra <link href="https://business.facebook.com/latest/settings/business_users?business_id=251271330097421">Business Settings - Pessoas</link>.'),
          step(2, 'Procure <b>José Paulo Rodrigues Nogueira</b> - <b>jose_exblade@me.com</b>.'),
          step(3, 'Confirme que aparece <b>Acesso total / Full control</b>. Já vimos este acesso, mas Raisa deve confirmar que continua ativo.'),
          p('B. Adicionar José à app', 'H2Brand'),
          step(4, 'Volte a <b>developers.facebook.com/apps</b> e abra <b>Use Me With Style Messaging</b>.'),
          step(5, 'No menu esquerdo, procure <b>App roles / Funções da app</b>, <b>Roles</b> ou <b>Basic settings / Definições básicas</b>.'),
          step(6, 'Escolha <b>Add people / Adicionar pessoas</b> ou <b>Add developers / Adicionar programadores</b>.'),
          step(7, 'Adicione o utilizador Facebook de José. Se a Meta permitir por email, use <b>jose_exblade@me.com</b>. Se pedir um nome de utilizador Facebook, peça esse nome à equipa - não tente outra pessoa.'),
          step(8, 'Conceda a função <b>Administrator / Administrador</b> da app. Se a Meta só permitir <b>Developer / Programador</b>, use Developer e avise a equipa.'),
          step(9, 'José poderá ter de aceitar um convite. Envie apenas uma mensagem a dizer que o convite foi criado.'),
          p('C. Associar a app ao negócio', 'H2Brand'),
          step(10, 'Abra <link href="https://business.facebook.com/latest/settings/apps?business_id=251271330097421">Business Settings - Apps</link>.'),
          step(11, 'Clique <b>Add / Adicionar</b>. Escolha a opção para associar/reivindicar uma app existente e introduza o <b>App ID</b>.'),
          step(12, 'Selecione a app e use <b>Assign people / Atribuir pessoas</b> para atribuir José com acesso total à app.'),
          box('Ponto de controlo', 'A app deve aparecer em Business Settings > Accounts > Apps. José deve aparecer entre as pessoas atribuídas. Envie uma captura dessas duas confirmações.', colors.HexColor('#EAF6EF'), green), PageBreak(), Spacer(1, 9*mm)]

story += [p('Parte 4 - Confirmar os ativos de Instagram e Facebook', 'H1Brand'),
          p('A equipa já viu os ativos, mas Raisa deve garantir que estão ligados e que as ferramentas podem ler mensagens.'),
          p('Página Facebook', 'H2Brand'),
          step(1, 'Abra <link href="https://business.facebook.com/latest/settings/pages?business_id=251271330097421">Business Settings - Pages</link>.'),
          step(2, 'Selecione <b>Use Me</b> - ID <b>251242313433656</b>.'),
          step(3, 'Clique <b>Assign people / Atribuir pessoas</b> e confirme José com permissões para gerir mensagens, definições e integrações.'),
          p('Instagram', 'H2Brand'),
          step(4, 'Abra <link href="https://business.facebook.com/latest/settings/instagram_account?business_id=251271330097421">Business Settings - Instagram accounts</link>.'),
          step(5, 'Selecione <b>@use_me_withstyle</b>.'),
          step(6, 'Atribua José e, se a interface permitir, associe a Página <b>Use Me</b> e a app <b>Use Me With Style Messaging</b>.'),
          step(7, 'No telemóvel, abra a aplicação Instagram com @use_me_withstyle. Vá a <b>Definições e privacidade</b> e confirme que é uma conta <b>Profissional/Business</b>, não uma conta pessoal.'),
          step(8, 'Nas definições de mensagens, procure <b>Connected tools / Ferramentas ligadas</b> ou <b>Allow access to messages / Permitir acesso às mensagens</b> e ative. A localização pode variar conforme a versão da app.'),
          step(9, 'Confirme que @use_me_withstyle está ligado à Página Facebook <b>Use Me</b>.'),
          box('Não criar outro Instagram', 'Não adicione uma conta nova e não desligue @use_me_withstyle da Página Use Me. Se a ligação falhar, pare e envie uma captura.'),
          p('Pontos de controlo', 'H2Brand'),
          check('@use_me_withstyle continua visível no portefólio Use Me.'),
          check('A conta é profissional/Business.'),
          check('A Página ligada é Use Me.'),
          check('José está atribuído à Página e ao Instagram.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Parte 5 - Confirmar o WhatsApp correto', 'H1Brand'),
          box('Raisa não deve concluir uma migração sozinha', 'O WhatsApp Cloud API pode pedir registo, migração ou coexistência do número. A escolha depende de como o número +244 933 617 878 é usado hoje. Pare antes do último botão e envolva a equipa técnica.'),
          step(1, 'Abra <link href="https://business.facebook.com/latest/settings/whatsapp_account?business_id=251271330097421">Business Settings - WhatsApp accounts</link>.'),
          step(2, 'Veja as contas <b>Use Me With Style</b> e <b>Raisa Bandeira</b>.'),
          step(3, 'Abra cada uma e procure <b>Phone numbers / Números de telefone</b>. Não altere nada.'),
          step(4, 'Identifique onde está o número <b>+244 933 617 878</b> e anote o nome exato da conta que o contém.'),
          step(5, 'Confirme se o número é usado atualmente na aplicação WhatsApp Business num telemóvel e se existem conversas importantes.'),
          step(6, 'Atribua José à conta WhatsApp correta com permissões para gerir a conta, números e mensagens.'),
          step(7, 'Na app <b>Use Me With Style Messaging</b>, procure <b>Add product / Adicionar produto</b> e escolha <b>WhatsApp</b>. Clique apenas em <b>Set up / Configurar</b>.'),
          step(8, 'Quando pedir um WhatsApp Business Account, selecione a conta correta identificada no passo 4.'),
          step(9, 'Se pedir para adicionar/verificar/migrar o número, <b>pare nesse ecrã</b>. Tire uma captura e contacte a equipa.'),
          p('Informação a enviar à equipa', 'H2Brand'),
          check('Nome exato da conta WhatsApp que contém +244 933 617 878.'),
          check('WhatsApp Business Account ID, se estiver visível. Este ID não é uma palavra-passe.'),
          check('Phone Number ID, se estiver visível. Este ID não é uma palavra-passe.'),
          check('Resposta: “O número é atualmente usado na aplicação WhatsApp Business: SIM/NÃO”.'),
          check('Resposta: “Raisa consegue receber SMS/chamada neste número: SIM/NÃO”.'),
          check('Captura do ecrã anterior à migração/coexistência, se aparecer.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Parte 6 - O que a equipa técnica fará depois', 'H1Brand'),
          p('Raisa não precisa fazer os passos abaixo. Esta lista explica por que precisamos dos acessos.'),
          step(1, 'Associar os produtos WhatsApp e Instagram/Messenger à app.'),
          step(2, 'Configurar as permissões necessárias para mensagens e para a Página/Instagram.'),
          step(3, 'Criar credenciais duráveis num utilizador de sistema do negócio, quando a Meta permitir.'),
          step(4, 'Guardar os segredos diretamente no Railway. Eles nunca serão colocados no código nem no PDF.'),
          step(5, 'Registar o callback <b>https://cms.usemewithstyle.shop/api/messaging-webhook</b> e um token privado de verificação.'),
          step(6, 'Ativar a assinatura criptográfica dos webhooks e subscrever eventos de mensagens.'),
          step(7, 'Executar mensagens reais de entrada e saída no WhatsApp e Instagram.'),
          step(8, 'Testar perguntas sobre pagamentos, entrega e estado de encomenda.'),
          step(9, 'Confirmar que devoluções, reclamações, reembolsos e cancelamentos ficam abertos para Raisa responder manualmente.'),
          step(10, 'Documentar renovação/rotação de credenciais e confirmar quem monitoriza as mensagens.'),
          box('Possível pedido adicional', 'A Meta pode exigir verificação da empresa, política de privacidade, eliminação de dados ou revisão de permissões antes de permitir mensagens fora das contas de teste. Se isso acontecer, a equipa dirá exatamente quais documentos Raisa deve fornecer.'),
          p('Como saber que terminou a parte de Raisa', 'H2Brand'),
          check('Raisa está registada no Meta for Developers.'),
          check('A app Use Me With Style Messaging existe e pertence ao portefólio Use Me.'),
          check('José aceitou acesso à app e aparece como Admin ou Developer.'),
          check('José está atribuído à Página, Instagram e conta WhatsApp correta.'),
          check('Raisa confirmou o número e se ele é usado na aplicação WhatsApp Business.'),
          check('Nenhuma palavra-passe, código, App Secret ou token foi enviado.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Mensagem pronta para Raisa enviar à equipa', 'H1Brand'),
          box('Copiar e preencher', '''Olá. Concluí a preparação Meta:<br/><br/>
1. Registo Meta for Developers: CONCLUÍDO / BLOQUEADO<br/>
2. App criada: Use Me With Style Messaging<br/>
3. App ID: ____________________<br/>
4. App associada ao portefólio Use Me: SIM / NÃO<br/>
5. José adicionado à app como: ADMIN / DEVELOPER / NÃO CONSEGUI<br/>
6. José atribuído à Página Use Me: SIM / NÃO<br/>
7. José atribuído ao Instagram @use_me_withstyle: SIM / NÃO<br/>
8. Conta WhatsApp correta: ____________________<br/>
9. WhatsApp Business Account ID (se visível): ____________________<br/>
10. Phone Number ID (se visível): ____________________<br/>
11. Número confirmado: +244 933 617 878 / OUTRO: __________<br/>
12. O número é usado atualmente na app WhatsApp Business: SIM / NÃO<br/>
13. Consigo receber SMS/chamada no número: SIM / NÃO<br/>
14. Apareceu migração/coexistência: SIM / NÃO<br/><br/>
Anexei capturas sem palavras-passe, códigos ou segredos.''', bluepale, colors.HexColor('#4B87A6')),
          p('Capturas permitidas', 'H2Brand'),
          check('My Apps com o nome e App ID.'),
          check('App roles mostrando José.'),
          check('Business Settings > Apps mostrando a app associada.'),
          check('Página, Instagram e WhatsApp mostrando nomes e IDs públicos.'),
          p('Capturas proibidas', 'H2Brand'),
          p('<font color="#9B2C2C"><b>Nunca mostrar:</b> palavra-passe, código SMS/2FA, App Secret, access token, recovery code, cartão bancário ou documento pessoal completo.</font>'),
          p('Se Raisa ficar bloqueada', 'H2Brand'),
          p('Pare no ecrã onde está. Tire uma captura completa sem segredos. Escreva qual passo deste PDF estava a seguir e copie a mensagem de erro exatamente. Não tente eliminar ativos ou criar contas duplicadas para contornar o erro.'), PageBreak(), Spacer(1, 9*mm)]

story += [p('Referências oficiais da Meta', 'H1Brand'),
          p('As interfaces da Meta mudam com frequência. Estes links oficiais devem ser usados se o nome de um botão for diferente:'),
          p('• <link href="https://developers.facebook.com/apps/">Meta for Developers - My Apps</link><br/>• <link href="https://business.facebook.com/latest/settings/business_users?business_id=251271330097421">Meta Business Settings - People</link><br/>• <link href="https://business.facebook.com/latest/settings/apps?business_id=251271330097421">Meta Business Settings - Apps</link><br/>• <link href="https://business.facebook.com/latest/settings/pages?business_id=251271330097421">Meta Business Settings - Pages</link><br/>• <link href="https://business.facebook.com/latest/settings/instagram_account?business_id=251271330097421">Meta Business Settings - Instagram accounts</link><br/>• <link href="https://business.facebook.com/latest/settings/whatsapp_account?business_id=251271330097421">Meta Business Settings - WhatsApp accounts</link><br/>• <link href="https://www.facebook.com/help/289207354498410/">Meta Help - About Facebook Page access</link><br/>• <link href="https://www.facebook.com/help/2783732558314697/">Meta Help - Connect a Facebook Page and WhatsApp account</link>'),
          Spacer(1,5*mm),
          box('Última nota', 'Este guia não pede a Raisa para concluir alterações irreversíveis. Se a Meta pedir migração do número, eliminação de uma conta, mudança de propriedade ou documentos legais, deve parar e envolver a equipa técnica.'),
          Spacer(1,8*mm), p('Fim do guia - versão de 30 July 2026', 'Sub')]

doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(OUT)
