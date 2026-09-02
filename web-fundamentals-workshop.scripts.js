window.DECK_SCRIPTS = {
  "deck": "web-fundamentals-workshop",
  "title": "How the Web Works",
  "generated": "2026-03-10",
  "model": "gpt-4o",
  "has_audio": true,
  "audio_voice": "nova",
  "scripts": [
    {
      "slide": 0,
      "slide_title": "How the Web Works",
      "script": "Understanding how the web works is crucial because it sets the foundation for everything we'll cover. This deck aims to fill the vocabulary gap you might have. When AI generates a REST API, it assumes you know what HTTP methods mean, why status codes exist, and what JSON is. By the end of this course, you'll have a solid grasp of these essential concepts. Next, we'll dive into the client-server relationship, which is the backbone of web interactions.",
      "word_count": 82,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 30,
          "target": "callout",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 1,
      "slide_title": "Client and Server",
      "script": "Every web interaction is essentially a conversation between two computers. You have a client, which is anything that sends requests—like a browser or a mobile app—and a server, which is a program that listens for those requests and sends back responses. HTTP is the protocol, or the language, they both speak. You don’t write raw HTTP; frameworks like Express handle that for you. Next, we'll explore HTTP, the language of the web, to understand how these conversations are structured.",
      "word_count": 83,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 23,
          "target": "callout",
          "source": "ai"
        },
        {
          "start_word": 42,
          "target": "diagram",
          "source": "ai"
        }
      ],
      "human_segments": [
        {
          "time_s": 0.2,
          "target": "title",
          "source": "human"
        }
      ]
    },
    {
      "slide": 2,
      "slide_title": "HTTP — The Language of the Web",
      "script": "HTTP, or HyperText Transfer Protocol, is like a rulebook for how clients and servers communicate. It defines the format of requests and responses, what different methods mean, and what status codes to use. A key concept is that HTTP is stateless, meaning each request is independent. This is why we use JWTs for authentication. While HTTP/2 and HTTP/3 are faster, they maintain the same semantics as HTTP/1.1. Let's look at a simplified raw HTTP request to see this in action.",
      "word_count": 91,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 54,
          "target": "callout",
          "source": "ai"
        },
        {
          "start_word": 90,
          "target": "code",
          "source": "ai"
        }
      ],
      "human_segments": [
        {
          "time_s": 22.01,
          "target": "code",
          "source": "human",
          "line": 4
        },
        {
          "time_s": 22.01,
          "target": "code",
          "source": "human",
          "line": 3
        },
        {
          "time_s": 22.01,
          "target": "code",
          "source": "human",
          "line": 2
        },
        {
          "time_s": 22.01,
          "target": "code",
          "source": "human",
          "line": 1
        }
      ]
    },
    {
      "slide": 3,
      "slide_title": "HTTP Methods — What You're Asking For",
      "script": "HTTP methods tell the server what action to perform. There are four main methods that cover most web APIs. PUT replaces the entire resource, which is rarely used; PATCH is preferred for partial updates. Safe methods like GET shouldn’t change data, while idempotent methods like PUT and DELETE yield the same result even if called multiple times. POST, however, is neither safe nor idempotent. Let's look at a table to see these methods and their characteristics.",
      "word_count": 85,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 40,
          "target": "callout",
          "source": "ai"
        },
        {
          "start_word": 85,
          "target": "table",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 4,
      "slide_title": "HTTP Status Codes — The Server's Reply",
      "script": "Every HTTP response includes a status code that tells you what happened. A 2xx code means success, like 200 for a successful read or update. A 4xx code indicates a client error, meaning you need to fix your request. A 5xx code is a server error, suggesting the server crashed. Check your logs for a stack trace if this happens. The table here lists common status codes and what they mean. Next, we'll break down the anatomy of a URL.",
      "word_count": 85,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 69,
          "target": "table",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 5,
      "slide_title": "Anatomy of a URL",
      "script": "A URL is more than just a web address; it’s a structured way to locate resources. The protocol, like https, ensures secure data transfer. The host is the server's address, while the path specifies the route on the server. Query strings add optional parameters to requests. Understanding these parts helps you navigate and construct URLs effectively. Next, we'll see what a request looks like in action.",
      "word_count": 72,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 59,
          "target": "callout",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 6,
      "slide_title": "What a Request Looks Like",
      "script": "A typical HTTP request includes several components. The method specifies the action, while the URL identifies the resource. Headers provide additional information, like authorization tokens and content type. The body contains the actual data being sent, which Express reads as req.body. This is how a POST request to add a book might look. Next, we’ll see what a response looks like from the server.",
      "word_count": 74,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 52,
          "target": "code",
          "source": "ai"
        },
        {
          "start_word": 53,
          "target": "list",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 7,
      "slide_title": "What a Response Looks Like",
      "script": "When a server responds, it sends back a status code and headers, informing the client how to handle the data. A 201 status code indicates a resource was successfully created. The content type tells the client how to parse the body, which contains the JSON payload. This JSON data is immediately available for further processing. Now, let’s look at JSON, the language of APIs.",
      "word_count": 67,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 49,
          "target": "code",
          "source": "ai"
        },
        {
          "start_word": 50,
          "target": "list",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 8,
      "slide_title": "JSON — The Language of APIs",
      "script": "JSON, or JavaScript Object Notation, is a text format that looks like JavaScript object syntax. It’s used to structure data for APIs. Strings are always in double quotes, numbers are unquoted, and booleans are lowercase. JSON doesn’t allow comments or trailing commas. Understanding these rules ensures your data is correctly parsed. Let's check out a JSON object and array to see these principles in action.",
      "word_count": 74,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 60,
          "target": "code",
          "source": "ai"
        },
        {
          "start_word": 61,
          "target": "list",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 10,
      "slide_title": "REST — A Style, Not a Protocol",
      "script": "REST, or Representational State Transfer, is a set of conventions for structuring APIs. An API that follows these conventions is called RESTful. This matters because AI-generated APIs often follow REST principles. Understanding REST helps you identify when an API deviates from these norms. Not every API is RESTful; alternatives like GraphQL and WebSockets exist. Next, we’ll look at RESTful routes and their predictable patterns.",
      "word_count": 74,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 58,
          "target": "callout",
          "source": "ai"
        },
        {
          "start_word": 62,
          "target": "list",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 11,
      "slide_title": "RESTful Routes — The Pattern",
      "script": "RESTful APIs follow a predictable URL structure, making it easy to guess a route once you know the pattern. Route parameters like :id are used to specify resources, and the /api/ prefix distinguishes API routes from HTML routes. Nested resources follow the same pattern, allowing you to build complex API structures. Let’s look at a table to see how different HTTP methods fit into this pattern.",
      "word_count": 72,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 64,
          "target": "table",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 12,
      "slide_title": "DNS — Domain Names to IP Addresses",
      "script": "Domain Name System, or DNS, translates domain names to IP addresses. When you use localhost, it resolves to your own machine without a DNS lookup. Railway, the platform we use, assigns a domain for your app, automatically handling DNS configuration. This simplifies deployment, allowing you to focus on building your application. Next, we’ll see how Express fits into this web ecosystem.",
      "word_count": 69,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 65,
          "target": "diagram",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 13,
      "slide_title": "How Express Fits In",
      "script": "Express is a minimal web server framework that makes handling HTTP requests straightforward. When you run your server, Express listens for incoming requests. Middleware functions process these requests, parsing JSON, authenticating users, and more. Route handlers match the URL to execute your code, which might query a database or apply business logic. Finally, Express sends a response back to the client. Let's see how understanding these steps helps you build robust web applications.",
      "word_count": 79,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 77,
          "target": "list",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 15,
      "slide_title": "What AI Assumes You Know",
      "script": "AI assumes you understand key web concepts when generating a REST API. It makes decisions on HTTP methods, status codes, JSON structure, and more. Knowing these concepts lets you verify those decisions and spot errors early. Ask yourself if AI-generated routes and JSON meet standards, like returning 404 for missing resources or consistent error responses. This proactive approach helps you catch bugs before they hit production. Next, we'll summarize key terms.",
      "word_count": 78,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        },
        {
          "start_word": 66,
          "target": "callout",
          "source": "ai"
        }
      ]
    },
    {
      "slide": 16,
      "slide_title": "Key Terms",
      "script": "This slide will summarize the key terms we've covered throughout the course. Understanding these terms is crucial for navigating web development and working effectively with APIs, whether you're writing them or interacting with them.",
      "word_count": 34,
      "segments": [
        {
          "start_word": 0,
          "target": "full",
          "source": "ai"
        }
      ]
    }
  ]
};
