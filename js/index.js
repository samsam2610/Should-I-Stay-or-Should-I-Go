const INIT_DENSITY = 0.00050, // particles per sq px
	INIT_RECOVERY = 1000,
	PARTICLE_RADIUS_RANGE = [1, 18],
	PARTICLE_VELOCITY_RANGE_MOVE = [0, 4];
	PARTICLE_VELOCITY_RANGE_STAY = [0, 0.05];
	INIT_INFECTION_PROB = 0.1;
var recoveryTime = INIT_RECOVERY,
	infectionRate = INIT_INFECTION_PROB; 

const canvasWidth = 300,
	canvasHeight = 300,
	svgCanvas_move = d3.select('svg#canvas_move')
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)

var borderPath_move = svgCanvas_move.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", canvasWidth)
		.attr("width", canvasHeight)
		.style("stroke", 'black')
		.style("fill", "none")
		.style("stroke-width", 2);

	svgCanvas_stay = d3.select('svg#canvas_stay')
		.attr('width', canvasWidth)
		.attr('height', canvasHeight);

var borderPath_stay = svgCanvas_stay.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", canvasWidth)
		.attr("width", canvasHeight)
		.style("stroke", 'black')
		.style("fill", "none")
		.style("stroke-width", 2);


const forceSim_move = d3.forceSimulation()
	.alphaDecay(0)
	.velocityDecay(0)
	.on('tick', particleDigest_move)
	.force('bounce', d3.forceBounce()
		.radius(d => d.r)
		.onImpact((node1, node2) => {
			if (node1.infected == true && node2.infected == false && node2.cured == false) {
				node2.infected = Math.random() >= (1 - infectionRate);			
			}
			if (node2.infected == true && node1.infected == false && node1.cured == false) {
				node1.infected = Math.random() >= (1 - infectionRate);			
			}

		})
	)
	.force('container', d3.forceSurface()
		.surfaces([
			{from: {x:0,y:0}, to: {x:0,y:canvasHeight}},
			{from: {x:0,y:canvasHeight}, to: {x:canvasWidth,y:canvasHeight}},
			{from: {x:canvasWidth,y:canvasHeight}, to: {x:canvasWidth,y:0}},
			{from: {x:canvasWidth,y:0}, to: {x:0,y:0}}
		])
		.oneWay(true)
		.radius(d => d.r)
	)

const forceSim_stay = d3.forceSimulation()
	.alphaDecay(0)
	.velocityDecay(0)
	.on('tick', particleDigest_stay)
	.force('bounce', d3.forceBounce()
		.radius(d => d.r)
		.onImpact((node1, node2) => {
			if (node1.infected == true && node2.infected == false && node2.cured == false) {
				node2.infected = Math.random() >= (1 - infectionRate);			
			}
			if (node2.infected == true && node1.infected == false && node1.cured == false) {
				node1.infected = Math.random() >= (1 - infectionRate);			
			}

		})
	)
	.force('container', d3.forceSurface()
		.surfaces([
			{from: {x:0,y:0}, to: {x:0,y:canvasHeight}},
			{from: {x:0,y:canvasHeight}, to: {x:canvasWidth,y:canvasHeight}},
			{from: {x:canvasWidth,y:canvasHeight}, to: {x:canvasWidth,y:0}},
			{from: {x:canvasWidth,y:0}, to: {x:0,y:0}}
		])
		.oneWay(true)
		.radius(d => d.r)
	)


// Init particles
onDensityChange(INIT_DENSITY);
onRecoveryChange(INIT_RECOVERY);
onInfectionChange(INIT_INFECTION_PROB);

// Event handlers
function onDensityChange(density) {
	var newNodes_move = genNodes(density, PARTICLE_VELOCITY_RANGE_MOVE, forceSim_move);
	var newNodes_stay = genNodes(density, PARTICLE_VELOCITY_RANGE_STAY, forceSim_stay);

	d3.select('#numparticles-val').text(newNodes_move.length);
	d3.select('#density-control').attr('value', density);
	newNodes_move[0].infected = true;
	newNodes_stay[0].infected = true;
	newNodes_stay[0].vx = 3;
	newNodes_stay[0].vy = 3;

	forceSim_move.nodes(newNodes_move);
	forceSim_stay.nodes(newNodes_stay)

}

function onElasticityChangeMove(elasticity) {
	d3.select('#elasticity-val-move').text(elasticity);
	forceSim_move.force('bounce').elasticity(elasticity);
	forceSim_move.force('container').elasticity(elasticity);
}

function onElasticityChangeStay(elasticity) {
	d3.select('#elasticity-val-stay').text(elasticity);
	forceSim_stay.force('bounce').elasticity(elasticity);
	forceSim_stay.force('container').elasticity(elasticity);
}

function onRecoveryChange(recoveryTimeChange) {
	d3.select('#recovery-val').text(recoveryTimeChange);
	recoveryTime = recoveryTimeChange;
}

function onInfectionChange(infectionRateChange) {
	d3.select('#infection-val').text(infectionRateChange);
	// d3.select('#infection-control').attr('value', infectionRate);
	infectionRate = infectionRateChange;
}



//

function genNodes(density, PARTICLE_VELOCITY_RANGE, forceSim) {
	const numParticles = Math.round(canvasWidth * canvasHeight * density),
		existingParticles = forceSim.nodes();

	// Trim
	if (numParticles < existingParticles.length) {
		return existingParticles.slice(0, numParticles);
	}

	// Append
	return [...existingParticles, ...d3.range(numParticles - existingParticles.length).map(() => {
		const angle = Math.random() * 2 * Math.PI,
			velocity = Math.random() * (PARTICLE_VELOCITY_RANGE[1] - PARTICLE_VELOCITY_RANGE[0]) + PARTICLE_VELOCITY_RANGE[0];

		return {
			x: Math.random() * canvasWidth,
			y: Math.random() * canvasHeight,
			vx: Math.cos(angle) * velocity,
			vy: Math.sin(angle) * velocity,
			r: Math.round(8),
			cured: false,
			infected: false,
			infectedDay: 0
		}
	})];
}

function particleDigest_move() {
	let particle = svgCanvas_move.selectAll('circle.particle').data(forceSim_move.nodes().map(hardLimit));

	particle.exit().remove();

	particle.merge(
		particle.enter().append('circle')
			.classed('particle', true)
			.attr('r', d=>d.r)
	)
		.attr('cx', d => d.x)
		.attr('fill', nodeColor)
		.attr('cy', d => d.y);

}

function particleDigest_stay() {
	let particle = svgCanvas_stay.selectAll('circle.particle').data(forceSim_stay.nodes().map(hardLimit));

	particle.exit().remove();

	particle.merge(
		particle.enter().append('circle')
			.classed('particle', true)
			.attr('r', d=>d.r)
	)
		.attr('cx', d => d.x)
		.attr('fill', nodeColor)
		.attr('cy', d => d.y);

}


function nodeColor(d) {
	if (d.infected == true) {
		d.infectedDay = d.infectedDay + 1; 
		if (d.infectedDay < recoveryTime) {
			return 'red';
		} else {
			d.cured = true;
			d.infected = false;
			return 'blue';
		}

	} else if (d.infected == false && d.cured == false) {
		return 'blue';
	} else if (d.infected == false && d.cured == true) {
		return 'green';
	}
}

function hardLimit(node) {
	// Keep in canvas
	node.x = Math.max(node.r, Math.min(canvasWidth-node.r, node.x));
	node.y = Math.max(node.r, Math.min(canvasHeight-node.r, node.y));

	return node;
}
