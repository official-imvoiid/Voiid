// An external link when there is somewhere to go, plain text when the URL is
// still blank in /admin - never a link to nowhere.
const Out = ({ href, children, ...rest }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  ) : (
    <span {...rest} aria-disabled="true">{children}</span>
  );

export default Out;
