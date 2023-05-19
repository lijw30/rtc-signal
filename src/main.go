package main

import (
	"fmt"
	"net/http"
)

func main() {
	// 1. 定义url前缀
	staticUrl := "/static/"

	// 2. 定义一个fileserver
	fs := http.FileServer(http.Dir("./static"))

	// 3. 绑定url和fileserver
	http.Handle(staticUrl, http.StripPrefix(staticUrl, fs))

	// 4. 启动httpserver
	//err := http.ListenAndServe(":8080", nil)
	err := http.ListenAndServeTLS(":8081", "./conf/cert.pem", "./conf/key.pem", nil)
	if err != nil {
		fmt.Println(err)
	}
}
