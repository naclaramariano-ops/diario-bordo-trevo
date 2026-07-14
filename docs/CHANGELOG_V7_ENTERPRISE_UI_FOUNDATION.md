# V7 Enterprise UI Foundation

- Design System Trevo Ehrmann com azul escuro, verde deep-dive, mostarda e vermelho semântico.
- Botões principais sólidos, sem gradientes.
- Cards e campos padronizados com contraste corporativo.
- Correção do avatar: atualização usa `UPDATE`, sem `UPSERT` incompleto.
- Foto é recortada ao centro, redimensionada para 512 × 512 e comprimida em WebP antes do upload.
- Upload aceita fotos de origem de até 20 MB; o arquivo final continua abaixo do limite do bucket.
- Arquivo de imagem do avatar é substituído no mesmo caminho, evitando acúmulo.
