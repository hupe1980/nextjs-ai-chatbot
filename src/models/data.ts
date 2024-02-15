interface Entry {
    [x: string]: any
    link: string
    title: string;
    text: string
}

interface EntryWithContext {
    [x: string]: any
    link: string
    title: string;
    text: string
    context: string
}