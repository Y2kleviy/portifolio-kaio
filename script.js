class SpiderWeb {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.mouse = { x: 0, y: 0 };
        this.ripples = [];
        this.colors = {
            lines: 'rgba(148, 85, 211, 0.3)',
            nodes: 'rgba(148, 85, 211, 0.8)',
            glow: 'rgba(255, 255, 255, 0.6)'
        };
        
        this.init();
    }

    init() {
        this.canvas.id = 'webCanvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        
        document.body.appendChild(this.canvas);
        
        this.resize();
        this.createNodes();
        this.createConnections();
        this.setupEventListeners();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createNodes() {
        const nodeCount = 30;
        const margin = 80;
        
        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * (this.canvas.width - margin * 2) + margin,
                y: Math.random() * (this.canvas.height - margin * 2) + margin,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
                originalRadius: 0
            });
        }
    }

    createConnections() {
        const maxDistance = 180;
        
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    this.connections.push({
                        node1: i,
                        node2: j,
                        distance: distance,
                        opacity: 1 - (distance / maxDistance)
                    });
                }
            }
        }
    }

    updateNodes() {
        this.nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;
            
            if (node.x < 0 || node.x > this.canvas.width) {
                node.vx *= -1;
                node.x = Math.max(0, Math.min(this.canvas.width, node.x));
            }
            if (node.y < 0 || node.y > this.canvas.height) {
                node.vy *= -1;
                node.y = Math.max(0, Math.min(this.canvas.height, node.y));
            }
            
            const dx = node.x - this.mouse.x;
            const dy = node.y - this.mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                const force = (120 - distance) / 120;
                node.vx += (dx / distance) * force * 0.08;
                node.vy += (dy / distance) * force * 0.08;
            }
            
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > 1.5) {
                node.vx = (node.vx / speed) * 1.5;
                node.vy = (node.vy / speed) * 1.5;
            }
            
            node.vx *= 0.99;
            node.vy *= 0.99;
        });
    }

    drawWeb() {
        // Limpar canvas completamente (sem rastro)
        this.ctx.fillStyle = 'rgba(10, 10, 10, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar conexões
        this.connections.forEach(conn => {
            const node1 = this.nodes[conn.node1];
            const node2 = this.nodes[conn.node2];
            
            const dx = node1.x - node2.x;
            const dy = node1.y - node2.y;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            
            const opacity = Math.max(0, 1 - (currentDistance / 180));
            
            if (opacity > 0.1) {
                const gradient = this.ctx.createLinearGradient(
                    node1.x, node1.y, node2.x, node2.y
                );
                gradient.addColorStop(0, this.colors.lines);
                gradient.addColorStop(1, 'rgba(74, 144, 226, 0.2)');
                
                this.ctx.beginPath();
                this.ctx.moveTo(node1.x, node1.y);
                this.ctx.lineTo(node2.x, node2.y);
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 0.8;
                this.ctx.stroke();
            }
        });
        
        // Desenhar nós
        this.nodes.forEach(node => {
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, node.radius * 3
            );
            gradient.addColorStop(0, 'rgba(148, 85, 211, 0.4)');
            gradient.addColorStop(1, 'rgba(148, 85, 211, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.nodes;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.glow;
            this.ctx.fill();
        });

        // Desenhar e atualizar ripples
        this.drawRipples();
    }

    drawRipples() {
        // Remover ripples que já terminaram
        this.ripples = this.ripples.filter(ripple => ripple.opacity > 0);
        
        // Desenhar cada ripple ativo
        this.ripples.forEach(ripple => {
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(148, 85, 211, ${ripple.opacity * 0.4})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Atualizar o ripple mais rapidamente
            ripple.radius += 8; // Aumentado de 4 para 8
            ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
            
            // Remover mais rapidamente quando estiver quase invisível
            if (ripple.opacity < 0.1) {
                ripple.opacity = 0;
            }
        });
    }

    animate() {
        this.updateNodes();
        this.drawWeb();
        requestAnimationFrame(() => this.animate());
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY);
        });

        window.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.createRipple(touch.clientX, touch.clientY);
        });
    }

    createRipple(x, y) {
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 150,
            opacity: 1
        };
        
        this.ripples.push(ripple);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new SpiderWeb();
});