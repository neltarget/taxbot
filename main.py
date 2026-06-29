from dotenv import load_dotenv
import sys

from taxbot import SYSTEM_PROMPT, create_client, get_response, postprocess_response, retrieve_context


def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode("utf-8", errors="replace").decode("utf-8", errors="replace"))


def main():
    load_dotenv()

    try:
        client, model = create_client()
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    print("TaxBot [GRA] — Ghana Revenue Authority Tax Assistant")
    print("Type 'quit' to exit, 'new' to start a fresh conversation.\n")

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit"):
            break
        if user_input.lower() == "new":
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            safe_print("Started a new conversation.\n")
            continue

        messages.append({"role": "user", "content": user_input})

        # Retrieve relevant context from RAG knowledge base
        rag_context = retrieve_context(user_input, n_results=3)

        try:
            reply = get_response(client, model, messages, rag_context=rag_context)
        except Exception as e:
            print(f"Error getting response: {e}")
            messages.pop()
            continue

        reply = postprocess_response(reply)
        messages.append({"role": "assistant", "content": reply})
        safe_print(f"TaxBot: {reply}\n")


if __name__ == "__main__":
    main()
