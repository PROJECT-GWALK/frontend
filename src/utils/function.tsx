export function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) =>
    urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}
