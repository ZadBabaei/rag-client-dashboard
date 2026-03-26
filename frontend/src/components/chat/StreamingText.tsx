interface StreamingTextProps {
  text: string;
}

export default function StreamingText({ text }: StreamingTextProps) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {text}
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-5 w-2 animate-pulse bg-gray-600 align-[-0.125rem]"
      />
    </span>
  );
}
