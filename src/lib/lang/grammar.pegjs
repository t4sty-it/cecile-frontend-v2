HelpedCommand
= cmd:(MetaCommand / Command) _ help:"?"? {
	if (help) {
    	return {
        	action: "help",
            target: cmd
        }
    }
    else return cmd
}

MetaCommand
= "#" _ cmd:([^? ]*) args:([ ]+ MetaArg+)* {
	return [{
    	action: "meta",
        target: cmd.reduce((a, x) => a + x),
        args: args.flatMap(x => x[1])
    }]
}

MetaArg
= [^ \n\r?]+ {
	return text()
}

Command
= head:ParameterizedTerm tail:(_ TargetedConnector _ Command _)* {
    return [head, ...tail.flatMap(t => [t[1], ...t[3]])]
}

TargetedConnector
  = outlet:Outlet? _ c:Connector _ inlet:Inlet? {
  	return {
    	...c,
        ...inlet,
        ...outlet
    }
  }

Connector "connector"
  = c:("<" / "=" / ">") {
  
  const lbls = {
  	'<': '1M',
    '=': '11',
    '>': 'M1'
  }
  
  return {
  	action: 'connect',
    type: lbls[c]
  }
}

ParameterizedTerm
  = t:Term _ p:ParamList? {
  	return { ...t, params: p }
  }

ParamList
  = head:Param tail:(_ Param)* {
  	return [head, ...tail.map(e => e[1])]
  }

Param "param"
  = "@" name:Identifier _ "=" _ value:(ParamExpression / ParamSymbol) {
  	return { name, value }
  }

ParamExpression "param expression"
  = head:ParamTerm tail:(_ ("+" / "-") _ ParamTerm)* {
  	return [head, ...tail.flatMap(e => [e[1], e[3]])]
    	.flat()
        .reduce((r, x) => `${r} ${x}`)
  }

ParamTerm "param term"
  = head:ParamExp tail:(_ ("*" / "/" ) _ ParamExp)* {
  	return [head, ...tail.flatMap(e => [e[1], e[3]])]
  }

ParamExp "param exponential"
  = head:ParamFactor tail:(_ ( "^" ) _ ParamFactor)* {
    const x = [head, ...tail.map(e => e[3])] 
  	return x.reduce((res, x) => res = `Math.pow(${res}, ${x})`)
  }

ParamFactor "param factor"
  = ("(" _ ParamExpression _ ")") / ParamValue

ParamValue
  = Float / Integer / "n" / "z" / "r"

ParamSymbol
  = id:Identifier {
  	return "'" + id + "'";
  }

Term
  = c:(Selector / Creator)

Inlet
  = l:Identifier _ "{" {
  	return {
    	inlet: l
    }
  }

Outlet
  = "}" _ l:Identifier {
  	return {
    	outlet: l
    }
  }

Selector "selector"
  = "$" n:NodeDefinition {
  	return {
    	action: 'select',
    	...n
    }
  }

Creator "creator"
  = quantity:( Integer _ "*" _ )? n:NodeDefinition {
    if (!n.node) throw new Error('Expected a node type to create')
    const q = (quantity && quantity[0]) ?? 1
  	return {
    	action: 'create',
        quantity: q,
        ...n
    }
  }


NodeDefinition "node definition"
  = node:Identifier? label:Label? {
    if (!node && !label) throw new Error("Expected identifier or label")
  
  	return {
    	node,
        label
    }
  }

Label "label"
  = ":" id:Identifier { return id }

Float "float"
  = "-"? [0-9]* "." [0-9]* {
  	return parseFloat(text())
  }

Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }

Identifier "identifier"
  = [a-zA-Z_][a-zA-Z_-]* { return text() }

_ "whitespace"
  = [ \t\n\r]*