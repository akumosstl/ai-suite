1 - vá para a pagina http://localhost:4200/menu

2 - clique no menu dropdown "Project"

3 - Escolha a opção "New Project"

4 - Preencha o formulário:

\- Project Name: "helloworld-copilot"

\- Description: "my first Agentic Code project"

\- Project Location: "C:\\Users\\MEUCOMPUTADOR\\.agentic-workspace\\helloworld\_copilot"



5 - clique no botão: "Create Project"

6 - Na página "/project" clique no botão "Create new pipeline" (sinal de "+")

7 - Na área "Create New Pipeline" preencha o formulário:

\- Pipeline Name:  HelloWorld

\- Output Extension: json

9 - Clique no botão: "Save Pipeline"

10 - De volta a página "/project" clique no menu superior no item: "Agents"

11 - estando na página de "/agents" na área de "Agent Details" preencha o formulário:

\- Name: hello\_world\_agent

\- Namespace: io.github.akumosstl

\- Path: 

\- Description: Hello World Agent!

clique no botão "Edit prompt" no modal window "Edit Agent Prompt" no textarea "Prompt" digite:



\- Just output: Hello World!



12 - Clique no botão "Save"

13 - Clique no botão "Create Agent"

14 - Clique no botão: "Back" no menu superior.

15 - Na página "/project" no painel a esquerda clique para expandir a lista de pipelines ( labeled como: "1 pipeline(s)")

16 - Clique na pipeline chamada: HelloWorld que vai ser exibida

17 - Clique no botão "Add Step" (Add step to pipeline)

18 - No modal "Add Step to Pipeline" na aba "Agents" selecione o agent: "hello\_world\_agent" na listagem de agents 

19 - clique no botão "Add to pipeline" e clique ok no alert window dizendo que o agent foi inserido com sucesso a pipeline



// \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*

// \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*

Na janela  "Step Settings" se o project já tem o target copilot o campo CLI da aba CLI deve vir selecionado o copilot.

Quando não tem mais steps pra rodar na pipeline, ou seja, todos os steps já rodaram, o botão "stop" deve ficar disabled



Quando estou na página "/project" e clico no em qualquer um desses itens: agents, skills, commands ou Management. quando clico no botão voltar ele deve manter aberta a pipeline que estava aberta em "/project" senão tivesse nenhuma pipeline aberta nao precisa exibir nenhuma aberta.



O modal para que abre para editar o campo "Prompt" das paginas: agents,skills, commands e scripts tem que ser maior, mais largo e mais alto.

E também o campo prompt e o botão editar propt no formulario, quando o usuario passa o mouse em cima deles, o cursor fica no formato de uma mão e

eles se tornam clicáveis, porém a parte clicavel e o mouse muda de mão somente se o mouse fica bem perto da borda inferior do campo prompt, melhore

o tamanho da área clicavel , sobre esse campo, para que em qualquer parte que o mouse passe do campo do form, ele se torne clicável.



O dropdown "Scope" deve ser removido das paginas: agents,skills, commands e scripts



Na página "/project" na area "Project Information" o campo "Target" deve ser um dropbox com todos os targets existentes no projeto.



\---------------------------------------

Quando clico em cima do step e clico o botão "console output" ele sempre está exibindo no console o output do ran anterior, ou seja se eu coloquei pra rodar

a pipeline e saido foi: Olá, e depois rodo de novo ele sempre mostra primeiro no console output "Olá" e só depois começa a exibir o output corrente do step.





Na página: "/pipeline-run-history" quando clico no botão "output" ele sempre mostra a saída duplicada se o output do step quando rodei foi:

\- Hello World



clicando no botão "output" ele mostra:

\- Hello World

\- Hello World

\----------------------------------



Ao tentar excluir uma skills ou um agent erro. Abaixo segue logs de erro de quando tento excluir skills, o log de erro do agent é bem parecido:



frontend:

skills.component.ts:1220  DELETE http://localhost:4200/api/skills/1 500 (Internal Server Error)

(anonymous) @ \_module-chunk.mjs:1206

Observable2.\_trySubscribe @ Observable.js:38

(anonymous) @ Observable.js:32

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ switchMap.js:14

OperatorSubscriber2.\_this.\_next @ OperatorSubscriber.js:15

Subscriber2.next @ Subscriber.js:34

(anonymous) @ innerFrom.js:51

Observable2.\_trySubscribe @ Observable.js:38

(anonymous) @ Observable.js:32

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ switchMap.js:10

(anonymous) @ lift.js:10

(anonymous) @ Observable.js:27

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ finalize.js:5

(anonymous) @ lift.js:10

(anonymous) @ Observable.js:27

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

doInnerSub @ mergeInternals.js:19

outerNext @ mergeInternals.js:14

OperatorSubscriber2.\_this.\_next @ OperatorSubscriber.js:15

Subscriber2.next @ Subscriber.js:34

(anonymous) @ innerFrom.js:51

Observable2.\_trySubscribe @ Observable.js:38

(anonymous) @ Observable.js:32

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

mergeInternals @ mergeInternals.js:53

(anonymous) @ mergeMap.js:14

(anonymous) @ lift.js:10

(anonymous) @ Observable.js:27

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ filter.js:6

(anonymous) @ lift.js:10

(anonymous) @ Observable.js:27

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ map.js:6

(anonymous) @ lift.js:10

(anonymous) @ Observable.js:27

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ catchError.js:9

(anonymous) @ lift.js:10

(anonymous) @ Observable.js:27

errorContext @ errorContext.js:19

Observable2.subscribe @ Observable.js:23

(anonymous) @ skills.component.ts:1220

ConsumerObserver2.next @ Subscriber.js:96

Subscriber2.\_next @ Subscriber.js:63

Subscriber2.next @ Subscriber.js:34

(anonymous) @ Subject.js:41

errorContext @ errorContext.js:19

Subject2.next @ Subject.js:31

close @ dialog.mjs:362

\_finishDialogClose @ dialog.mjs:338

(anonymous) @ dialog.mjs:267

ConsumerObserver2.next @ Subscriber.js:96

Subscriber2.\_next @ Subscriber.js:63

Subscriber2.next @ Subscriber.js:34

(anonymous) @ Subject.js:41

errorContext @ errorContext.js:19

Subject2.next @ Subject.js:31

dispose @ \_overlay-module-chunk.mjs:778

close @ dialog.mjs:361

\_finishDialogClose @ dialog.mjs:338

(anonymous) @ dialog.mjs:262

ConsumerObserver2.next @ Subscriber.js:96

Subscriber2.\_next @ Subscriber.js:63

Subscriber2.next @ Subscriber.js:34

(anonymous) @ take.js:12

OperatorSubscriber2.\_this.\_next @ OperatorSubscriber.js:15

Subscriber2.next @ Subscriber.js:34

(anonymous) @ filter.js:6

OperatorSubscriber2.\_this.\_next @ OperatorSubscriber.js:15

Subscriber2.next @ Subscriber.js:34

ConsumerObserver2.next @ Subscriber.js:96

Subscriber2.\_next @ Subscriber.js:63

Subscriber2.next @ Subscriber.js:34

(anonymous) @ Subject.js:41

errorContext @ errorContext.js:19

Subject2.next @ Subject.js:31

emit @ \_effect-chunk2.mjs:2264

\_finishDialogClose @ dialog.mjs:103

setTimeout

\_waitForAnimationToComplete @ dialog.mjs:115

\_startExitAnimation @ dialog.mjs:88

close @ dialog.mjs:289

PipelineResultDialogComponent\_Template\_button\_click\_7\_listener @ pipeline-result-dialog.component.ts:27

executeListenerWithErrorHandling @ \_debug\_node-chunk.mjs:8146

wrapListenerIn\_markDirtyAndPreventDefault @ \_debug\_node-chunk.mjs:8133

(anonymous) @ \_dom\_renderer-chunk.mjs:566Understand this error

api.service.ts:878 deleteSkill failed: Http failure response for http://localhost:4200/api/skills/1: 500 Internal Server Error



&#x20;backend



2026-04-10T19:59:45.728-03:00 ERROR 15420 --- \[agentic-backend] \[nio-8080-exec-5] o.a.c.c.C.\[.\[.\[/].\[dispatcherServlet]    : Servlet.service() for servlet \[dispatcherServlet] in context with path \[] threw exception \[Request processing failed: org.springframework.dao.DataIntegrityViolationException: could not execute statement \[Referential integrity constraint violation: "FK79WLC9NJ5O6M744DARCL6OKEJ: PUBLIC.PROJECT\_SKILLS FOREIGN KEY(SKILL\_ID) REFERENCES PUBLIC.SKILL(ID) (CAST(1 AS BIGINT))"; SQL statement:

delete from skill where id=? \[23503-224]] \[delete from skill where id=?]; SQL \[delete from skill where id=?]; constraint \["FK79WLC9NJ5O6M744DARCL6OKEJ: PUBLIC.PROJECT\_SKILLS FOREIGN KEY(SKILL\_ID) REFERENCES PUBLIC.SKILL(ID) (CAST(1 AS BIGINT))"; SQL statement:

delete from skill where id=? \[23503-224]]] with root cause



org.h2.jdbc.JdbcSQLIntegrityConstraintViolationException: Referential integrity constraint violation: "FK79WLC9NJ5O6M744DARCL6OKEJ: PUBLIC.PROJECT\_SKILLS FOREIGN KEY(SKILL\_ID) REFERENCES PUBLIC.SKILL(ID) (CAST(1 AS BIGINT))"; SQL statement:

delete from skill where id=? \[23503-224]

// \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*

// \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*



