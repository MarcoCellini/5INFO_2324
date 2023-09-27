#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <string.h>
#include<sys/wait.h>

/* 
man 7 ip
man 7 tcp
 */

#define BUFSIZE 1024
#define MAX_CONN 10

/* man perror */
void error(char *msg) 
{
  perror(msg);
  exit(1);
}

int socket_create() 
{
    int socket_fd;

    if((socket_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP)) < 0){
        error("Errore nella creazione del socket");
    }
    return socket_fd;
}

void socket_bind(int socket_fd, unsigned short tcp_port) 
{
    struct sockaddr_in serveraddr; /* server address */
  
    /* inizializza la struttura che contiene le informazioni del socket */
    memset(&serveraddr, '0', sizeof(serveraddr));
    serveraddr.sin_family = AF_INET; /* socket IP */
    serveraddr.sin_addr.s_addr = htonl(INADDR_ANY); /* 0.0.0.0 */
    serveraddr.sin_port = htons(tcp_port); /* porta tcp in network order*/

    /* bind del socket con indirizzo e porta */
    if(bind(socket_fd, (struct sockaddr *) &serveraddr, sizeof(serveraddr)) < 0) 
        error("Errore nella fase di binding");
}

void socket_listen(int socket_fd) 
{
    if(listen(socket_fd, MAX_CONN) < 0) /* in ascolto sul socket max 10 connessioni*/ 
        error("Errore nella fase di listen");
}

int socket_accept(int socket_fd) 
{
    int connection_fd;
    struct sockaddr_in clientaddr; /* client address */
    socklen_t clientlen = sizeof(clientaddr);
    
    /* accetta una connessione TCP da un client */
    if((connection_fd = accept(socket_fd, 
                            (struct sockaddr *) &clientaddr, 
                            &clientlen)) < 0)
        error("Errore nella fase di accept");
    return connection_fd;
}

int socket_receive(int socket_fd, char *buf)
{
    int msg_size;

    bzero(buf, BUFSIZE);
    if((msg_size = read(socket_fd, buf, BUFSIZE)) < 0)
        error("Errore nella ricezione dati");
    
    return msg_size;
}

int socket_send(int fd, char *buf){
	int send_status = write(fd, buf, sizeof(buf));
	if(send_status == -1){
		error("Errore nell'invio dei dati");
	};

	return send_status;
}

void manage_a_client(int connection_fd) {
	char buf[BUFSIZE];
	int msg_size = socket_receive(connection_fd, buf);
        printf("TCP server ha ricevuto %d byte: %s\n", msg_size, buf);
	
	socket_send(connection_fd, buf);

        /* chiudo la connessione con il client */
        close(connection_fd);
}
void create_new_proecss(int connection_fd) {
	int pid;
	printf("Entering in manage_a_client\n");
	
        if((pid = fork()) == 0) {
		printf("OK\n");
		manage_a_client(connection_fd);	// Elabora la comunicazione con il socket
		printf("Killing\n");
		exit(0);
	}else {
		wait(NULL);	// Kill child
	}	
}

int main(int argc, char **argv) 
{
    unsigned short tcp_port; /* TCP port in ascolto */
    int socket_fd;           /* welcoming socket file descriptor */
    char buf[BUFSIZE];       /* RX buffer */
    int msg_size;            /* dimensione messaggio ricevuto */

    /* Verifico la presenza del parametro porta e lo leggo*/ 
    if(argc != 2) {
        printf("uso: %s <porta>\n", argv[0]);
        exit(1);
    }
    tcp_port = (unsigned short)atoi(argv[1]);

    /* Creo il socket */ 
    socket_fd = socket_create();

    /* bind del socket a IP e porta */
    socket_bind(socket_fd, tcp_port);

    /* metto il socket in ascolto */
    socket_listen(socket_fd); 
    
    /* ciclo principale del server */
    printf("Server TCP pronto e in ascolto sulla porta %d\n\n", tcp_port);

    for(;;){
	create_new_proecss(socket_accept(socket_fd));	// Ascoltiamo per nuove connessioni e gestiamola nella fork 	
    }

}
