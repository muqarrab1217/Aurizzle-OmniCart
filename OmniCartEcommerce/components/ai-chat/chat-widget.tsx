"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"
import api, { type AgentAction, type ProductSuggestion, type ChatResponse } from "@/lib/api"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  actions?: AgentAction[]
  products?: ProductSuggestion[]
  intent?: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your OmniCart AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const assetBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api$/, "")

  const formatPrice = (price?: number, currency?: string) => {
    if (typeof price !== "number") return undefined
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD"
      }).format(price)
    } catch {
      return `${currency || "USD"} ${price.toFixed(2)}`
    }
  }

  const getProductImageUrl = (image?: string | null) => {
    if (!image) return null
    if (image.startsWith("http")) return image
    if (assetBaseUrl) return `${assetBaseUrl}${image}`
    return image
  }

  const renderProductSuggestions = (products: ProductSuggestion[]) => {
    if (!products.length) return null

    return (
      <div className="mt-3 space-y-3">
        {products.map((product) => {
          const priceLabel = formatPrice(product.price, product.currency)
          const imageUrl = getProductImageUrl(product.image)

          return (
            <div
              key={`product-${product.id}`}
              className="rounded-lg border border-border bg-background/70 p-3 shadow-sm"
            >
              <div className="flex gap-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted" />
                )}
                <div className="flex-1">
                  <p className="font-medium leading-tight">{product.name}</p>
                  {product.shopName && (
                    <p className="text-xs text-muted-foreground">Sold by {product.shopName}</p>
                  )}
                  {priceLabel && (
                    <p className="text-sm font-semibold mt-1">{priceLabel}</p>
                  )}
                  {typeof product.rating === "number" && product.rating > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Rating: {product.rating.toFixed(1)} ⭐</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={product.url}>View details</Link>
                    </Button>
                    {product.shopUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={product.shopUrl}>Visit shop</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderActionButtons = (actions: AgentAction[]) => {
    if (!actions.length) return null

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action, index) => {
          if (action.type === "navigate" && action.href) {
            return (
              <Button key={`action-${index}`} variant="outline" size="sm" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            )
          }

          return (
            <Button key={`action-${index}`} variant="secondary" size="sm" disabled>
              {action.label}
            </Button>
          )
        })}
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    const query = inputMessage
    setInputMessage("")
    setIsTyping(true)

    try {
      const response = await api.sendChatMessage(query)
      const agentData: ChatResponse | undefined = response.data
      if (!agentData) {
        throw new Error("No response from assistant. Please try again.")
      }
      const reply = agentData.reply || response.message || "I'm still learning how to help with that."
      const sources = Array.isArray(agentData?.sources) ? agentData?.sources : []
      const actions = Array.isArray(agentData?.actions) ? agentData?.actions : []
      const products = Array.isArray(agentData?.products) ? agentData?.products : []
      const intent = typeof agentData?.intent === "string" ? agentData.intent : "general"

      const formattedReply = formatAssistantReply(reply, sources)

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: formattedReply,
        timestamp: new Date(),
        actions,
        products,
        intent
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error("Chat error", error)
      const fallback = getFallbackResponse(query)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallback,
        timestamp: new Date(),
        actions: [],
        products: [],
        intent: "error"
      }
      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const formatAssistantReply = (reply: string, sources: any[]) => {
    if (!sources || sources.length === 0) {
      return reply
    }

    const sourceLines = sources
      .filter((source) => source?.name)
      .map((source) => {
        if (source.url) {
          return `• ${source.name} (${source.url})`
        }
        return `• ${source.name}`
      })

    if (!sourceLines.length) {
      return reply
    }

    return `${reply}\n\nSources:\n${sourceLines.join("\n")}`
  }

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
      return "I can help you track your orders! Please visit the 'My Orders' page to see all your order details and tracking information."
    } else if (lowerQuery.includes("product") || lowerQuery.includes("shop")) {
      return "You can browse our products on the Shop page. We have a wide variety of items across different categories!"
    } else if (lowerQuery.includes("payment") || lowerQuery.includes("checkout")) {
      return "We accept multiple payment methods including Cash on Delivery, Credit Cards, and Debit Cards. All transactions are secure and encrypted."
    } else if (lowerQuery.includes("delivery") || lowerQuery.includes("shipping")) {
      return "Standard delivery takes 4-5 business days. You can track your order status in real-time from the Orders page."
    } else if (lowerQuery.includes("return") || lowerQuery.includes("refund")) {
      return "We offer easy returns within 7 days of delivery. Please contact our support team for initiating a return or refund."
    } else if (lowerQuery.includes("account") || lowerQuery.includes("profile")) {
      return "You can manage your account details, update personal information, and change your password from the Profile page."
    } else {
      return "I'm here to help! You can ask me about orders, products, payments, delivery, returns, or account management. What would you like to know?"
    }
  }

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform bg-primary text-primary-foreground"
            aria-label="Open AI Chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        ) : (
          <Card className="w-[480px] h-[550px] flex flex-col shadow-2xl">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg p-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-5 w-5 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-3 whitespace-pre-line ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.role === "user"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        {message.role === "user" && (
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      {message.role === "assistant" && message.products?.length ? (
                        <div className="ml-11">
                          {renderProductSuggestions(message.products)}
                        </div>
                      ) : null}
                      {message.role === "assistant" && message.actions?.length ? (
                        <div className="ml-11">
                          {renderActionButtons(message.actions)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="px-3"
                    disabled={!inputMessage.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

