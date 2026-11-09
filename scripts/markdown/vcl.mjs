// A small TextMate grammar for Varnish VCL, which Shiki does not bundle.
// Enough for the configs we publish: comments, strings, keywords, subroutines, variables, durations.
export default {
  name: 'vcl',
  scopeName: 'source.vcl',
  aliases: ['varnish'],
  patterns: [
    { name: 'comment.line.number-sign.vcl', match: '#.*$' },
    { name: 'comment.line.double-slash.vcl', match: '//.*$' },
    { name: 'comment.block.vcl', begin: '/\\*', end: '\\*/' },
    { name: 'string.quoted.double.vcl', begin: '"', end: '"' },
    { name: 'keyword.control.vcl', match: '\\b(if|else|elsif|elseif|return|call|synth|include|import|new)\\b' },
    { name: 'storage.type.vcl', match: '\\b(sub|acl|backend|probe|vcl)\\b' },
    { name: 'keyword.other.vcl', match: '\\b(set|unset)\\b' },
    { name: 'entity.name.function.vcl', match: '\\bvcl_[a-z_]+\\b' },
    { name: 'support.constant.vcl', match: '\\b(pass|pipe|hash|lookup|purge|deliver|fetch|restart|retry|abandon)\\b' },
    { name: 'variable.language.vcl', match: '\\b(req|bereq|beresp|resp|obj|client|server|local|remote)(\\.[A-Za-z0-9_-]+)+' },
    { name: 'variable.other.property.vcl', match: '\\.[a-z_]+(?=\\s*=)' },
    { name: 'constant.numeric.vcl', match: '\\b\\d+(\\.\\d+)?(ms|s|m|h|d|w|y)?\\b' },
    { name: 'keyword.operator.vcl', match: '(==|!=|!~|~|&&|\\|\\||!|=)' },
  ],
}
