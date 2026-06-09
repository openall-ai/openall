
export const openHtmlViewTool = {
    type: "function",
    function: {
        name: "attach_artifact",
        description: "Attach a structured view using HTML content.",
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The title for the window being shown. This should be short text, 2-4 words. I.e. 'CRM Contacts' or 'Edit Jim Monroe', etc."
                },
                windowId: {
                    type: "number",
                    description: "The window ID to display the content from the existing open windows, or 0 to create a new window.",
                },
                content: {
                    type: "string",
                    description: "The HTML content for the view to be shown. Should be a <div> tag. Use tailwindcss for styling. The background is already set to gray-100 and padding is applied in the parent. You don't need to set this for the content. Do not wrap in `. Call global js function doAction() with parameters describing what should be done to perform actions in handlers (buttons, etc). Do not add <script> tags just call doAction in a click handler etc. Do not enter dynamic content in the doAction params they are fetched for you just describe the action taken."
                },
            },
            required: ["content"]
        }
    }
};

export const queryDatabase = {
    type: "function",
    function: {
        name: "query_db",
        description: "Run a query on the sqlite DB.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The sqlite query to run on the db. Could be to list all tables, get their schema, etc. Any SQLite query."
                },
            },
            required: ["query"]
        }
    }
};