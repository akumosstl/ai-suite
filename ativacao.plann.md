# Plano de Ativação - AI Suite

## Visão Geral

Sistema de licenciamento offline onde o usuário insere um código de ativação (UUID) fornecido pelo desenvolvedor após pagamento PayPal. Cada código pode ser usado apenas uma vez, associado ao HWID da máquina.

## Requisitos

- **100% offline** - Sem conexão externa para validação
- **Código de ativação:** UUID fornecido pelo desenvolvedor
- **Associação:** Código → HWID (1 uso por código)
- **Sem ativação:** Limitado a 1 projeto

---

## Fase 1: Backend - Entidades e Repositories

### 1.1 Nova Entidade `ActivationCode`

**Arquivo:** `backend/src/main/java/.../model/ActivationCode.java`

```java
@Entity
public class ActivationCode {
    @Id
    private String code; // UUID como String (PK)
    
    @Column(nullable = false)
    private boolean used = false;
    
    private String hwid; // HWID da máquina que usou
    private LocalDateTime activatedAt;
    private LocalDateTime createdAt;
}
```

### 1.2 Nova Entidade `License`

**Arquivo:** `backend/src/main/java/.../model/License.java`

```java
@Entity
public class License {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String hwid;
    
    @Column(nullable = false)
    private boolean active = true;
    
    private LocalDateTime activatedAt;
    private LocalDateTime expiresAt; // null = permanente
}
```

### 1.3 Novo Repository

**Arquivo:** `backend/src/main/java/.../repository/ActivationCodeRepository.java`

```java
public interface ActivationCodeRepository extends JpaRepository<ActivationCode, String> {
    Optional<ActivationCode> findByCode(String code);
}
```

**Arquivo:** `backend/src/main/java/.../repository/LicenseRepository.java`

```java
public interface LicenseRepository extends JpaRepository<License, Long> {
    Optional<License> findByHwid(String hwid);
    boolean existsByHwidAndActiveTrue(String hwid);
}
```

---

## Fase 2: Backend - Services

### 2.1 Service de HWID

**Arquivo:** `backend/src/main/java/.../service/HwidService.java`

```java
@Service
public class HwidService {
    
    public String getHwid() {
        // Combina: CPU ID + Disco ID + BIOS UUID
        String cpuId = getCpuId();
        String diskId = getDiskId();
        String biosUuid = getBiosUuid();
        
        // Hash SHA-256 dos valores combinados
        String combined = cpuId + "|" + diskId + "|" + biosUuid;
        return hashToUuid(combined);
    }
    
    private String getCpuId() {
        // Executa: wmic cpu get ProcessorId
    }
    
    private String getDiskId() {
        // Executa: wmic diskdrive get serialnumber
    }
    
    private String getBiosUuid() {
        // Executa: wmic csproduct get UUID
    }
}
```

### 2.2 Service de Ativação

**Arquivo:** `backend/src/main/java/.../service/ActivationService.java`

```java
@Service
public class ActivationService {
    
    @Autowired private ActivationCodeRepository activationCodeRepo;
    @Autowired private LicenseRepository licenseRepo;
    @Autowired private HwidService hwidService;
    
    public ActivationResult activate(String code) {
        // 1. Validar formato UUID
        if (!isValidUuid(code)) {
            return new ActivationResult(false, "Código inválido");
        }
        
        // 2. Buscar código
        Optional<ActivationCode> activationCode = activationCodeRepo.findByCode(code);
        if (activationCode.isEmpty()) {
            return new ActivationResult(false, "Código não encontrado");
        }
        
        // 3. Verificar se já foi usado
        if (activationCode.get().isUsed()) {
            return new ActivationResult(false, "Código já utilizado");
        }
        
        // 4. Registrar HWID e marcar como usado
        String hwid = hwidService.getHwid();
        activationCode.get().setUsed(true);
        activationCode.get().setHwid(hwid);
        activationCode.get().setActivatedAt(LocalDateTime.now());
        activationCodeRepo.save(activationCode.get());
        
        // 5. Criar licença
        License license = new License();
        license.setHwid(hwid);
        license.setActive(true);
        license.setActivatedAt(LocalDateTime.now());
        licenseRepo.save(license);
        
        return new ActivationResult(true, "Ativado com sucesso");
    }
    
    public boolean isLicensed() {
        String hwid = hwidService.getHwid();
        return licenseRepo.existsByHwidAndActiveTrue(hwid);
    }
    
    public LicenseStatus getStatus() {
        if (isLicensed()) {
            return LicenseStatus.LICENSED;
        }
        return LicenseStatus.UNLICENSED;
    }
}
```

### 2.3 DTOs

**Arquivo:** `backend/src/main/java/.../dto/ActivationRequest.java`

```java
public class ActivationRequest {
    @NotBlank
    private String code;
}
```

**Arquivo:** `backend/src/main/java/.../dto/ActivationResponse.java`

```java
public class ActivationResponse {
    private boolean success;
    private String message;
    private LicenseStatus status;
}
```

---

## Fase 3: Backend - Controller

### 3.1 Controller de Ativação

**Arquivo:** `backend/src/main/java/.../controller/ActivationController.java`

```java
@RestController
@RequestMapping("/api/activation")
public class ActivationController {
    
    @Autowired private ActivationService activationService;
    
    @PostMapping("/activate")
    public ResponseEntity<ActivationResponse> activate(@RequestBody ActivationRequest request) {
        ActivationResult result = activationService.activate(request.getCode());
        ActivationResponse response = new ActivationResponse();
        response.setSuccess(result.isSuccess());
        response.setMessage(result.getMessage());
        response.setStatus(activationService.getStatus());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/status")
    public ResponseEntity<ActivationResponse> getStatus() {
        ActivationResponse response = new ActivationResponse();
        response.setSuccess(true);
        response.setStatus(activationService.getStatus());
        return ResponseEntity.ok(response);
    }
}
```

---

## Fase 4: Backend - Geração de Códigos

### 4.1 Script Utilitário

**Arquivo:** `backend/src/main/java/.../service/ActivationCodeGenerator.java`

```java
@Service
public class ActivationCodeGenerator {
    
    public String generateCode() {
        return UUID.randomUUID().toString().toUpperCase();
    }
    
    // Usado para pré-carregar códigos no banco
    @PostConstruct
    public void initDefaultCodes() {
        // Gera 10 códigos para teste inicial
        for (int i = 0; i < 10; i++) {
            ActivationCode code = new ActivationCode();
            code.setCode(generateCode());
            activationCodeRepo.save(code);
        }
    }
}
```

### 4.2 Seed via application.properties

Alternativamente, adicionar no `application.properties`:
```properties
# Lista de códigos separados por vírgula (para uso inicial)
activation.codes=UUID1,UUID2,UUID3
```

E criar `ActivationCodeInitializer.java` para carregar esses códigos no banco.

---

## Fase 5: Backend - Limitação de Funcionalidades

### 5.1 Verificação de Projeto Único

**Arquivo:** `backend/src/main/java/.../service/ProjectLimitService.java`

```java
@Service
public class ProjectLimitService {
    
    @Autowired private ProjectRepository projectRepo;
    @Autowired private ActivationService activationService;
    
    public boolean canCreateProject() {
        if (activationService.isLicensed()) {
            return true; // Licenciado = ilimitado
        }
        
        // Não licenciado = máximo 1 projeto
        long count = projectRepo.count();
        return count < 1;
    }
    
    public void validateProjectCreation() {
        if (!canCreateProject()) {
            throw new LicenseException("Limite atingido. Ative o software para criar mais projetos.");
        }
    }
}
```

### 5.2 Interceptador/AOP

Modificar `ProjectController` para usar `ProjectLimitService.validateProjectCreation()`.

---

## Fase 6: Backend - Integração PayPal

### 6.1 Service de Pagamento

**Arquivo:** `backend/src/main/java/.../service/PaymentService.java`

```java
@Service
public class PaymentService {
    
    // Gera link de pagamento PayPal
    public String generatePaymentLink(double amount, String currency, String description) {
        // Usa PayPal SDK ou API REST
        // Retorna URL de pagamento para enviar ao cliente
    }
}
```

### 6.2 Controller de Pagamento

**Arquivo:** `backend/src/main/java/.../controller/PaymentController.java`

```java
@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    @GetMapping("/link")
    public ResponseEntity<PaymentLinkResponse> getPaymentLink() {
        String link = paymentService.generatePaymentLink(29.99, "USD", "AI Suite - Licença Vitalícia");
        return ResponseEntity.ok(new PaymentLinkResponse(link));
    }
}
```

> **Nota:** Para 100% offline, o link é gerado manualmente pelo desenvolvedor via dashboard PayPal e enviado ao cliente. O backend só precisa expor um endpoint fixo configurável.

---

## Fase 7: Frontend - Angular

### 7.1 Service de Licença

**Arquivo:** `desktop-angular/src/app/services/license.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class LicenseService {
  private apiUrl = '/api/activation';
  
  activate(code: string): Observable<ActivationResponse> {
    return this.http.post<ActivationResponse>(`${this.apiUrl}/activate`, { code });
  }
  
  getStatus(): Observable<ActivationResponse> {
    return this.http.get<ActivationResponse>(`${this.apiUrl}/status`);
  }
  
  isLicensed(): boolean {
    const status = this.licenseStatus();
    return status === 'LICENSED';
  }
  
  canCreateProject(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/can-create-project`);
  }
}
```

### 7.2 Tela de Ativação

**Arquivo:** `desktop-angular/src/app/pages/activation/activation.component.ts`

```typescript
@Component({
  selector: 'app-activation',
  template: `
    <div class="activation-container">
      <h2>Ativar AI Suite</h2>
      
      @if (status === 'UNLICENSED') {
        <p>Insira seu código de ativação</p>
        <input [(ngModel)]="code" placeholder="Código de ativação" />
        <button (click)="activate()">Ativar</button>
        
        @if (error) {
          <p class="error">{{ error }}</p>
        }
      } @else {
        <p>Software ativado!</p>
      }
    </div>
  `
})
export class ActivationComponent {
  code = '';
  status: LicenseStatus = 'UNKNOWN';
  error = '';
  
  constructor(private licenseService: LicenseService) {}
  
  ngOnInit() {
    this.licenseService.getStatus().subscribe(res => {
      this.status = res.status;
    });
  }
  
  activate() {
    this.licenseService.activate(this.code).subscribe({
      next: (res) => {
        if (res.success) {
          this.status = res.status;
          this.error = '';
        } else {
          this.error = res.message;
        }
      },
      error: () => {
        this.error = 'Erro ao ativar. Tente novamente.';
      }
    });
  }
}
```

### 7.3 Bloqueio de Funcionalidades

**Arquivo:** `desktop-angular/src/app/guards/license.guard.ts`

```typescript
export const licenseGuard: CanActivateFn = (route, state) => {
  const licenseService = inject(LicenseService);
  const router = inject(Router);
  
  if (licenseService.isLicensed()) {
    return true;
  }
  
  router.navigate(['/activation']);
  return false;
};
```

Modificar rotas para proteger criação de projetos:
```typescript
{
  path: 'projects/new',
  component: ProjectFormComponent,
  canActivate: [licenseGuard]
}
```

---

## Fase 8: Fluxo do Usuário

```
┌─────────────────────────────────────────────────────────┐
│                    FLUXO DE ATIVAÇÃO                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   1. Usuário abre app pela primeira vez                │
│      ↓                                                  ��
│   2. Verifica status em /api/activation/status         │
│      ↓                                                  │
│   3. Status = UNLICENSED                               │
│      ↓                                                  │
│   4. Redireciona para tela de ativação                 │
│      ↓                                                  │
│   5. Usuário insere código UUID                        │
│      ↓                                                  │
│   6. POST /api/activation/activate                     │
│      ↓                                                  │
│   7. Backend:                                         │
│      - Valida código existe                             │
│      - Verifica se não usado                           │
│      - Gera HWID da máquina                            │
│      - Marca código como usado + registra HWID       │
│      - Cria licença ativa                              │
│      ↓                                                  │
│   8. Retorna success=true                             │
│      ↓                                                  │
│   9. Usuário pode usar软件 completo                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar

### Backend
- [ ] `model/ActivationCode.java`
- [ ] `model/License.java`
- [ ] `repository/ActivationCodeRepository.java`
- [ ] `repository/LicenseRepository.java`
- [ ] `service/HwidService.java`
- [ ] `service/ActivationService.java`
- [ ] `dto/ActivationRequest.java`
- [ ] `dto/ActivationResponse.java`
- [ ] `controller/ActivationController.java`
- [ ] `service/PaymentService.java`
- [ ] `controller/PaymentController.java`

### Frontend
- [ ] `services/license.service.ts`
- [ ] `pages/activation/activation.component.ts`
- [ ] `pages/activation/activation.component.scss`
- [ ] `guards/license.guard.ts`

---

## Considerações de Segurança

1. **HWID não é 100% à prova de spoofing** - usuário avançado pode modificar
2. **Armazenar códigos em arquivo seguro** - não expor no código fonte em produção
3. **Log de ativações** - auditoria para detectar abuso
4. **Backup do banco** - manter registros de licencias

---

## Ordem de Implementação Recomendada

1. Modelo de dados (ActivationCode, License)
2. Repositories
3. HwidService
4. ActivationService
5. Controller de Ativação
6. Frontend - Service
7. Frontend - Tela de Ativação
8. Limitação de projetos
9. Payment link (endpoint básico)
10. Testes e ajustes