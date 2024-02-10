# API 명세

- 토큰이 필수인 곳은 `토큰 O`라 표시하고, 필수가 아닌 값은 주석으로 `필수 X`라고 표시했습니다.
- 인증(`auth`)은 `HTTP` 헤더를 사용해서 진행됩니다.<br>

  |      Key      |       Value        |
  | :-----------: | :----------------: |
  | Content-Type  | `application/json` |
  | Authorization |   `Bearer token`   |

* ## Auth

  - ### 로그인: `POST` `/auth/login`

    - `Request`

      ```json
      {
        "email": string,     // 이메일 양식
        "password": string   // 최대 20글자
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "LOGIN_SUCCESS",
        "data": {
          "accessToken": string,
          "refreshToken": string
        }
      }
      ```

  - ### 엑세스 토큰 재발급: `POST` `/auth/reissue` `토큰 O`

    - `Request`

      ```json
      // 헤더에 Authorization: 'Bearer token', refreshtoken: 'Bearer token' 필요
      {}
      ```

    - `Response`

      ```json
      {
        "statusCode": 201,
        "message": "CREATE_SUCCESS",
        "data": {
          "accessToken": string
        }
      }
      ```

* ## User

  - ### 회원가입: `POST` `/users`

    - `Request`

      ```json
      {
        "email": string,     // 이메일 양식
        "password": string   // 최대 20글자
        "nickname": string   // 최대 10글자
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 201,
        "message": "CREATE_SUCCESS"
      }
      ```

* ## Post

  - ### 글 생성: `POST` `/posts` `토큰 O`

    - `Request`

      ```json
      // form-data
      {
        "images": file,    // 이미지 파일. 여러개 가능. 필수 X
        "title": text,     // 최대 20글자
        "content": text    // 최대 500글자
        "category": text   // enum으로 notice, qa, ask 가능
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 201,
        "message": "CREATE_SUCCESS"
      }
      ```

  - ### 글 조회: `GET` `/posts`

    - `Request`

      ```json
      // 쿼리스트링
      {
        "pageNo": number,      // 양수만. 필수 X
        "pageSize": number,    // 양수만. 필수 X
        "category": string,    // enum으로 notice, qa, ask 가능
        "sort": string,        // enum으로 newest, popularity 가능. 필수 X
        "period" string,       // enum으로 total, one-year, one-month, one-week 가능. 필수 X. 정렬이 인기순일 때만 가능
        "keyword": string      // 최소 2글자. 필수 X
        "criteria": string     // enum으로 all, title, writer 가능. 필수 X. 키워드 있을 때만 가능
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "READ_SUCCESS".
        "data": {
          "currentPage": number,
          "totalCount": number,
          "pageSize": number,
          "totalPage": number,
          "items": [
            {
              "id": string,
              "title": string,
              "viewCount": number,
              "createdAt": date,
              "user": {
                "id": string,
                "nickname": string
              }
            }
          ]
        }
      }
      ```

  - ### 글 상세 조회: `GET` `/posts/:postId` `토큰 옵션`

    - `Request`

      ```json
      // 토큰있으면 isMyPost 표시
      {}
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "READ_SUCCESS".
        "data": {
          "id": string,
          "title": string,
          "content": string,
          "viewCount": number,
          "createdAt": date,
          "category": {
            "id": string,
            "name": string
          },
          "user": {
            "id": string,
            "nickname": string
          },
          "image": [
            {
              "id": string,
              "url": string
            }
          ],
          "isMyPost": boolean   // 토큰 없으면 다 false
        }
      }
      ```

  - ### 글 수정: `PATCH` `/posts/:postId` `토큰 O`

    - `Request`

      ```json
      // form-data
      {
        "images": file,    // 이미지 파일. 여러개 가능. 필수 X
        "title": text,     // 최대 20글자
        "content": text    // 최대 500글자
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "UPDATE_SUCCESS".
      }
      ```

  - ### 글 삭제: `DELETE` `/posts/:postId` `토큰 O`

    - `Request`

      ```json
      {}
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "DELETE_SUCCESS".
      }
      ```

* ## Comment

  - ### 댓글 생성: `POST` `/posts/:postId/comments` `토큰 O`

    - `Request`

      ```json
      {
        "content": string,    // 최대 20글자
        "parentId": number,   // 양수만. 필수 X. 있으면 대댓글
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 201,
        "message": "CREATE_SUCCESS"
      }
      ```

  - ### 댓글 조회: `GET` `/posts/:postId/comments` `토큰 옵션`

    - `Request`

      ```json
      // 토큰있으면 isMyPost 표시
      {}
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "READ_SUCCESS".
        "data": {
          "currentPage": number,
          "totalCount": number,
          "pageSize": number,
          "totalPage": number,
          "items": [
            {
              "id": string,
              "content": string,
              "group": number,        // 댓글 그룹
              "sequence": date,       // 댓글 순서
              "depth": date,          // 댓글 깊이
              "user": {
                "id": string,
                "nickname": string
              },
              "isMyComment": false    // 토큰 없으면 다 false
            }
          ]
        }
      }
      ```

  - ### 댓글 수정: `PATCH` `/posts/:postId/comments/:commentId` `토큰 O`

    - `Request`

      ```json
      {
        "content": text    // 최대 20글자
      }
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "UPDATE_SUCCESS".
      }
      ```

  - ### 댓글 삭제: `DELETE` `/posts/:postId/comments/:commentId` `토큰 O`

    - `Request`

      ```json
      {}
      ```

    - `Response`

      ```json
      {
        "statusCode": 200,
        "message": "DELETE_SUCCESS".
      }
      ```
