Resumen de Cambios                                                                         
                                                                                         
  Archivos Modificados/Creados                                                               
  Archivo: web/package.json                                                                  
  Cambio: Agregado @crypto.com/facilitator-client                                            
  ────────────────────────────────────────                                                   
  Archivo: web/src/hooks/useX402Payment.ts                                                   
  Cambio: NUEVO - Utilidades para generar payment headers                                    
  ────────────────────────────────────────                                                   
  Archivo: web/src/api/capabilities.ts                                                       
  Cambio: Clases PaymentRequiredError y ApiError, nueva función                              
  executeCapabilityWithPayment()                                                             
  ────────────────────────────────────────                                                   
  Archivo: web/src/components/PaymentModal.tsx                                               
  Cambio: Rediseñado con estados de progreso y mejor UX                                      
  ────────────────────────────────────────                                                   
  Archivo: web/src/components/ChatInterface.tsx                                              
  Cambio: Flujo x402 completo integrado                                                      
  ---                                                                                        
  Flujo de Pago Implementado                                                                 
                                                                                             
  1. Usuario ejecuta → Request inicial (sin X-PAYMENT)                                       
                                ↓                                                            
  2. Backend devuelve 402 con PaymentRequirements                                            
                                ↓                                                            
  3. Frontend muestra modal "Confirm Payment"                                                
                                ↓                                                            
  4. Usuario hace clic "Confirm & Pay"                                                       
                                ↓                                                            
  5. Se abre MetaMask para firmar (generatePaymentHeader)                                    
                                ↓                                                            
  6. Usuario firma → Payment header generado                                                 
                                ↓                                                            
  7. Retry con header X-PAYMENT → Backend verifica y liquida                                 
                                ↓                                                            
  8. Resultado mostrado al usuario                                                           
                                                                                             
  ---                                                                                        
  Mejoras de UX Implementadas                                                                
                                                                                             
  1. Modal renombrado: "Confirm Payment" (no "Payment Required")                             
  2. Botón principal: "Confirm & Pay" (no "Retry")                                           
  3. Estados de progreso:                                                                    
    - "Opening wallet..."                                                                    
    - "Please sign in your wallet..."                                                        
    - "Confirming transaction..."                                                            
    - "Finalizing..."                                                                        
    - "Payment complete!"                                                                    
  4. Mensajes de error claros:                                                               
    - Usuario cancela → "Transaction cancelled..."                                           
    - Fondos insuficientes → "Insufficient funds..."                                         
    - Red incorrecta → "Wrong network. Please switch to Cronos Testnet"                      
  5. Link al faucet cuando hay error de fondos insuficientes                                 
  6. Link al explorer después de éxito (cuando hay txHash)                                   
                                                                                             
  ---                                                                                        
  Donde se almacena el challenge 402                                                         
                                                                                             
  // ChatInterface.tsx línea 73                                                              
  const [x402Challenge, setX402Challenge] = useState<X402Challenge | null>(null);            
                                                                                             
  // Se captura cuando el backend devuelve 402:                                              
  // ChatInterface.tsx líneas 245-251                                                        
  if (error instanceof PaymentRequiredError) {                                               
    setX402Challenge(error.challenge);  // ← Aquí se guarda                                  
    setPaymentState('awaiting_approval');                                                    
    setFlowState('confirm_payment');                                                         
  }                                                                                          
                                                                                             
  ---                                                                                        
  Checklist de Testing                                                                       
                                                                                             
  Happy Path                                                                                 
                                                                                             
  - Conectar wallet a Cronos Testnet                                                         
  - Seleccionar capability (ej: Contract Scan)                                               
  - Ingresar address válida                                                                  
  - Click "Execute $0.01"                                                                    
  - Modal aparece con "Confirm Payment"                                                      
  - Click "Confirm & Pay"                                                                    
  - MetaMask abre para firma                                                                 
  - Confirmar en MetaMask                                                                    
  - Ver estados de progreso                                                                  
  - Resultado mostrado                                                                       
                                                                                             
  Casos de Error                                                                             
                                                                                             
  - Wallet no conectada → Error "Please connect your wallet first"                           
  - Red incorrecta → Error + prompt para cambiar red                                         
  - Usuario cancela en MetaMask → Error "Transaction cancelled"                              
  - Fondos insuficientes → Error + link al faucet                                            
  - Backend rechaza payment → Error específico                                               
                                                                                             
  ---                                                                                        
  Variables de Entorno Requeridas                                                            
                                                                                             
  Frontend (web/.env):                                                                       
  VITE_API_URL=https://cronosia-production.up.railway.app                                    
  VITE_CRONOS_NETWORK=testnet                                                                
                                                                                             
  Backend (railway env):                                                                     
  FRONTEND_URL=https://tu-app.vercel.app                                                     
  NODE_ENV=production                                                                        
                                                       