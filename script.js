
const prompt = document.getElementById("prompt");
const submitbtn = document.getElementById("submit");
const imagebtn = document.getElementById("image");
const imageinput = imagebtn.querySelector('input[type="file"]');
const chatContainer = document.getElementById("chatContainer");
const image = imagebtn.querySelector("img");

const API_URL = "http://localhost:5000/api/chat";

const user = {
    file: {
        mime_type: null,
        data: null,
        preview: null
    }
};

function scrollToBottom() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth"
    });
}

function showAIMessage(element, message) {
    if (window.marked && window.DOMPurify) {
        element.innerHTML = DOMPurify.sanitize(
            marked.parse(message)
        );
    } else {
        element.textContent = message;
    }
}

function createUserMessage(message, file) {
    const chatBox = document.createElement("div");
    chatBox.className = "user-chatbox";

    const avatar = document.createElement("img");
    avatar.src = "user.png";
    avatar.alt = "You";
    avatar.id = "userImage";
    avatar.width = 8;

    const area = document.createElement("div");
    area.className = "user-chat-area";
    area.textContent = message;

    if (file.data && file.mime_type) {
        const uploadedImage = document.createElement("img");
        uploadedImage.src = `data:${file.mime_type};base64,${file.data}`;
        uploadedImage.alt = "Uploaded image";
        uploadedImage.className = "chooseimg";
        area.appendChild(uploadedImage);
    }

    chatBox.append(avatar, area);
    chatContainer.appendChild(chatBox);
}

function createAIChatBox() {
    const chatBox = document.createElement("div");
    chatBox.className = "ai-chat-box";

    const avatar = document.createElement("img");
    avatar.src = "ai.png";
    avatar.alt = "AI";
    avatar.id = "aiImage";
    avatar.width = 10;

    const area = document.createElement("div");
    area.className = "ai-chat-area";
    area.textContent = "Thinking...";

    chatBox.append(avatar, area);
    chatContainer.appendChild(chatBox);

    return chatBox;
}

async function generateResponse(aiChatBox, message, file) {
    const text = aiChatBox.querySelector(".ai-chat-area");

    try {
        const parts = [];

        if (message) {
            parts.push({ text: message });
        }

        if (file.data && file.mime_type) {
            parts.push({
                inline_data: {
                    mime_type: file.mime_type,
                    data: file.data
                }
            });
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Backend/API error:", data);
            throw new Error(
                data.error?.message ||
                data.error ||
                `Request failed with status ${response.status}`
            );
        }

        const apiResponse = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!apiResponse) {
            console.error("Unexpected response:", data);
            throw new Error(
                "No text response received. Please try again."
            );
        }

        showAIMessage(text, apiResponse);

    } catch (error) {
        console.error("Chatbot error:", error);

        if (error instanceof TypeError) {
            text.textContent =
                "Cannot connect to the backend. Make sure server.js is running on port 5000.";
        } else {
            text.textContent =
                error.message || "Something went wrong. Please try again.";
        }
    } finally {
        scrollToBottom();
    }
}

function handleChatResponse() {
    const message = prompt.value.trim();
    const currentFile = { ...user.file };

    if (!message && !currentFile.data) {
        return;
    }

    createUserMessage(message, currentFile);

    prompt.value = "";

    user.file = {
        mime_type: null,
        data: null,
        preview: null
    };

    image.src = "img.svg";
    image.classList.remove("choose");
    imageinput.value = "";

    scrollToBottom();

    const aiChatBox = createAIChatBox();

    generateResponse(aiChatBox, message, currentFile);
}

submitbtn.addEventListener("click", handleChatResponse);

prompt.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleChatResponse();
    }
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        imageinput.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5 MB.");
        imageinput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = event => {
        const result = event.target.result;
        const base64String = result.split(",")[1];

        user.file = {
            mime_type: file.type,
            data: base64String,
            preview: result
        };

        image.src = result;
        image.classList.add("choose");
    };

    reader.onerror = () => {
        alert("Could not read the image. Please try again.");
    };

    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", event => {
    if (event.target.closest("input")) {
        return;
    }

    imageinput.click();
});