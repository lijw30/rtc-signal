package main

import (
	"fmt"
	"net/http"
)

func startHttp(port string) {
	fmt.Printf("Start http port: %s\n", port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		fmt.Println(err)
	}
}

func startHttps(port, cert, key string) {
	fmt.Printf("Start https port: %s\n", port)
	err := http.ListenAndServeTLS(port, cert, key, nil)
	if err != nil {
		fmt.Println(err)
	}
}

func main() {
	// 1. 定义url前缀
	staticUrl := "/static/"

	// 2. 定义一个fileserver
	fs := http.FileServer(http.Dir("./static"))

	// 3. 绑定url和fileserver
	http.Handle(staticUrl, http.StripPrefix(staticUrl, fs))

	// 4. 启动http server
	go startHttp(":8080")
	// 5. 启动http server
	startHttps(":8081", "./conf/cert.pem", "./conf/key.pem")
}
